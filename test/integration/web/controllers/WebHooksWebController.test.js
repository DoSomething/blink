'use strict';

// ------- Imports -------------------------------------------------------------

const chai = require('chai');
const test = require('ava');

const RabbitManagement = require('../../../helpers/RabbitManagement');
const HooksHelper = require('../../../helpers/HooksHelper');
const MessageFactoryHelper = require('../../../helpers/MessageFactoryHelper');
const twilioHelper = require('../../../helpers/twilio');

// ------- Init ----------------------------------------------------------------

chai.should();
test.beforeEach(HooksHelper.startBlinkWebApp);
test.afterEach(HooksHelper.stopBlinkWebApp);

// ------- Tests ---------------------------------------------------------------

/**
 * GET /api/v1/webhooks
 */
test('GET /api/v1/webhooks should respond with JSON list available webhooks', async (t) => {
  const res = await t.context.supertest.get('/api/v1/webhooks')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  // TODO: check in loop or use .equal()?
  res.body.should.have.property('customerio-email-activity')
    .and.have.string('/api/v1/webhooks/customerio-email-activity');

  res.body.should.have.property('twilio-sms-inbound')
    .and.have.string('/api/v1/webhooks/twilio-sms-inbound');

  res.body.should.have.property('customerio-gambit-broadcast')
    .and.have.string('/api/v1/webhooks/customerio-gambit-broadcast');

  res.body.should.have.property('customerio-sms-status-active')
    .and.have.string('/api/v1/webhooks/customerio-sms-status-active');

  res.body.should.have.property('twilio-sms-outbound-status')
    .and.have.string('/api/v1/webhooks/twilio-sms-outbound-status');
});

/**
 * POST /api/v1/webhooks/customerio
 */
test.serial('POST /api/v1/webhooks/customerio-email-activity should publish message to customer-io queue', async (t) => {
  const data = MessageFactoryHelper.getCustomerIoWebhookData();

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-email-activity')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(202);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  res.body.should.have.property('ok', true);

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  // Note: might be in conflict with POST /api/v1/events/quasar-relay test
  const messages = await rabbit.getMessagesFrom('quasar-customer-io-email-activity', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

test.serial('POST /api/v1/webhooks/customerio-email-activity should publish email_unsubscribed events to the quasar-customer-io-email-activity and quasar-customer-io-email-unsubscribed queues', async (t) => {
  const data = MessageFactoryHelper.getCustomerIoWebhookData();
  data.event_type = 'email_unsubscribed';

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-email-activity')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(202);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  res.body.should.have.property('ok', true);

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  // Note: might be in conflict with POST /api/v1/events/quasar-relay test
  const results = [];
  results.push(await rabbit.getMessagesFrom('quasar-customer-io-email-activity', 1, false));
  results.push(await rabbit.getMessagesFrom('quasar-customer-io-email-unsubscribed', 1, false));

  results.forEach((result) => {
    result.should.be.an('array').and.to.have.lengthOf(1);
    result[0].should.have.property('payload');
    const payload = result[0].payload;
    const messageData = JSON.parse(payload);
    messageData.should.have.property('data');
    messageData.data.should.be.eql(data);
  });
});


/**
 * POST /api/v1/webhooks/twilio-sms-inbound
 */
test('POST /api/v1/webhooks/twilio-sms-inbound should fail with 403 forbidden for invalid Twilio requests', async (t) => {
  const data = {
    random: 'key',
    nested: {
      random2: 'key2',
    },
  };

  const res = await t.context.supertest.post('/api/v1/webhooks/twilio-sms-inbound')
    .send(data);

  res.status.should.be.equal(403);
});

/**
 * POST /api/v1/webhooks/twilio-sms-inbound
 */
test('POST /api/v1/webhooks/twilio-sms-inbound should be queued when a valid x-twilio-signature is received', async (t) => {
  const message = MessageFactoryHelper.getTwilioInboundMessage();
  const data = message.getData();

  const serverAddress = t.context.blink.web.server.address();
  const readableUrl = `http://${serverAddress.address}`;
  const path = '/api/v1/webhooks/twilio-sms-inbound';

  const twilioSignature = twilioHelper.getTwilioSignature(
    t.context.config.twilio.authToken,
    `${readableUrl}${path}`,
    data);

  const res = await t.context.supertest.post(path)
    .set('x-twilio-signature', twilioSignature)
    .send(data);

  // Ensure TwiML compatible response.
  res.status.should.be.equal(204);
  res.res.statusMessage.toLowerCase().should.equal('no content');

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  const messages = await rabbit.getMessagesFrom('twilio-sms-inbound-gambit-relay', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

/**
 * POST /api/v1/webhooks/customerio-gambit-broadcast
 */
test('POST /api/v1/webhooks/customerio-gambit-broadcast responds w/ 422 if northstarId is missing', async (t) => {
  const data = MessageFactoryHelper.getGambitBroadcastMessage().getData();
  delete data.northstarId;

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-gambit-broadcast')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(422);
  res.body.should.have.property('ok', false);
  res.body.should.have.property('message')
    .and.have.string('"northstarId" is required');
});

test('POST /api/v1/webhooks/customerio-gambit-broadcast responds w/ 422 if broadcastId is missing', async (t) => {
  const data = MessageFactoryHelper.getGambitBroadcastMessage().getData();
  delete data.broadcastId;

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-gambit-broadcast')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(422);
  res.body.should.have.property('ok', false);
  res.body.should.have.property('message')
    .and.have.string('"broadcastId" is required');
});

test('POST /api/v1/webhooks/customerio-gambit-broadcast responds w/ 201 if mobile is missing (is optional)', async (t) => {
  const data = MessageFactoryHelper.getGambitBroadcastMessage().getData();
  delete data.mobile;

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-gambit-broadcast')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(201);
  res.body.should.have.property('ok', true);
  res.body.should.have.property('code')
    .and.have.string('success_message_queued');
});

test('POST /api/v1/webhooks/customerio-gambit-broadcast responds w/ 201 if message is valid', async (t) => {
  const data = MessageFactoryHelper.getGambitBroadcastMessage().getData();

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-gambit-broadcast')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(201);
  res.body.should.have.property('ok', true);
  res.body.should.have.property('code')
    .and.have.string('success_message_queued');
});

/**
 * POST /api/v1/webhooks/customerio-sms-status-active
 */
test('POST /api/v1/webhooks/customerio-sms-status-active validates incoming payload', async (t) => {
  const data = MessageFactoryHelper.getSmsActiveMessage().getData();
  delete data.northstarId;

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-sms-status-active')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(422);
  res.body.should.have.property('ok', false);
  res.body.should.have.property('message')
    .and.have.string('"northstarId" is required');
});

/**
 * POST /api/v1/webhooks/twilio-sms-outbound-status
 */
test('POST /api/v1/webhooks/twilio-sms-outbound-status should be queued in twilio-sms-outbound-status-relay when a valid x-twilio-signature is received', async (t) => {
  const message = MessageFactoryHelper.getTwilioOutboundDeliveredStatusMessage();
  const data = message.getData();

  const serverAddress = t.context.blink.web.server.address();
  const readableUrl = `http://${serverAddress.address}`;
  const path = '/api/v1/webhooks/twilio-sms-outbound-status';

  const twilioSignature = twilioHelper.getTwilioSignature(
    t.context.config.twilio.authToken,
    `${readableUrl}${path}`,
    data);

  const res = await t.context.supertest.post(path)
    .set('x-twilio-signature', twilioSignature)
    .send(data);

  // Ensure TwiML compatible response.
  res.status.should.be.equal(204);
  res.res.statusMessage.toLowerCase().should.equal('no content');

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  const messages = await rabbit.getMessagesFrom('twilio-sms-outbound-status-relay', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');

  /**
   * This is funky because deliveredAt is a property we inject based on the current timestamp
   * just before enqueuing the message. IRL the payload we get from Twilio would not have a
   * deliveredAt property and would only have it after we injected it, before being enqueued.
   */
  delete messageData.data.deliveredAt;
  messageData.data.should.be.eql(data);
});


/**
 * POST /api/v1/webhooks/twilio-sms-outbound-status
 */
test('POST /api/v1/webhooks/twilio-sms-outbound-status should be queued in twilio-sms-outbound-error-relay when a valid x-twilio-signature is received', async (t) => {
  const message = MessageFactoryHelper.getTwilioOutboundErrorStatusMessage();
  const data = message.getData();

  const serverAddress = t.context.blink.web.server.address();
  const readableUrl = `http://${serverAddress.address}`;
  const path = '/api/v1/webhooks/twilio-sms-outbound-status';

  const twilioSignature = twilioHelper.getTwilioSignature(
    t.context.config.twilio.authToken,
    `${readableUrl}${path}`,
    data);

  const res = await t.context.supertest.post(path)
    .set('x-twilio-signature', twilioSignature)
    .send(data);

  // Ensure TwiML compatible response.
  res.status.should.be.equal(204);
  res.res.statusMessage.toLowerCase().should.equal('no content');

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  const messages = await rabbit.getMessagesFrom('twilio-sms-outbound-error-relay', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');

  /**
   * This is funky because failedAt is a property we inject based on the current timestamp
   * just before enqueuing the message. IRL the payload we get from Twilio would not have a
   * failedAt property and would only have it after we injected it, before being enqueued.
   */
  delete messageData.data.failedAt;
  messageData.data.should.be.eql(data);
});

// ------- End -----------------------------------------------------------------
