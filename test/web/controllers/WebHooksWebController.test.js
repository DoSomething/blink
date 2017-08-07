'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const RabbitManagement = require('../../../src/lib/RabbitManagement');
const HooksHelper = require('../../helpers/HooksHelper');

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
  res.body.should.have.property('customerio-email-activity')
    .and.have.string('/api/v1/webhooks/customerio-email-activity');
  res.body.should.have.property('gambit-chatbot-mdata')
    .and.have.string('/api/v1/webhooks/gambit-chatbot-mdata');
  res.body.should.have.property('moco-message-data')
    .and.have.string('/api/v1/webhooks/moco-message-data');
});

/**
 * POST /api/v1/webhooks/customerio
 */
test('POST /api/v1/webhooks/customerio-email-activity should publish message to customer-io queue', async (t) => {
  const data = {
    data: {
      campaign_id: '0',
      customer_id: 'example_customer',
      email_address: 'example@customer.io',
      email_id: 'example_email',
      subject: 'Example Email',
      template_id: '0',
    },
    event_id: 'abc123',
    event_type: 'example_webhook',
    timestamp: 1491337360,
  };

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
  // TODO: queue cleanup to make sure that it's not OLD message.
  const messages = await rabbit.getMessagesFrom('quasar-customer-io-email-activity', 1);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

/**
 * POST /api/v1/webhooks/gambit-chatbot-mdata
 */
test('POST /api/v1/webhooks/gambit-chatbot-mdata should validate incoming message', async (t) => {
  // Test empty message
  const responseToEmptyPayload = await t.context.supertest
    .post('/api/v1/webhooks/gambit-chatbot-mdata')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send({});
  responseToEmptyPayload.status.should.be.equal(422);
  responseToEmptyPayload.body.should.have.property('ok', false);
  responseToEmptyPayload.body.should.have.property('message')
    .and.have.string('"phone" is required');

  // Test one of [keyword, args, mms_image_url] presence rule
  const testOneOfPayload = {
    phone: '15555225222',
    profile_id: '167181555',
    message_id: '841415468',
    // Empty string should be treated as not present
    keyword: '',
    args: '',
    mms_image_url: '',
  };
  const responseToTestOneOfPayload = await t.context.supertest
    .post('/api/v1/webhooks/gambit-chatbot-mdata')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(testOneOfPayload);
  responseToTestOneOfPayload.status.should.be.equal(422);
  responseToTestOneOfPayload.body.should.have.property('ok', false);
  responseToTestOneOfPayload.body.should.have.property('message')
    .and.have.string('must contain at least one of [keyword, args, mms_image_url]');

  // Test one of [keyword, args, mms_image_url] presence rule
  const minimalViablePayload = {
    phone: '15555225222',
    profile_id: '167181555',
    message_id: '841415468',
    keyword: 'BLINKMEUP',
  };
  const responseToMinimalViablePayload = await t.context.supertest
    .post('/api/v1/webhooks/gambit-chatbot-mdata')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(minimalViablePayload);
  responseToMinimalViablePayload.status.should.be.equal(200);
  responseToMinimalViablePayload.body.should.have.property('ok', true);

  // Test empty message
  // TODO: factory test data generator?
  const fullPayload = {
    phone: '15555225222',
    carrier: 'tmobile',
    profile_id: '167181555',
    profile_first_name: 'Sergii',
    profile_last_name: 'Tkachenko',
    profile_email: 'sergii+test-blink@dosomething.org',
    profile_street1: 'FL 1',
    profile_street2: '',
    profile_city: 'New York',
    profile_state: 'NY',
    profile_postal_code: '10010',
    profile_age: '',
    profile_birthdate: '2000-01-01',
    profile_birthyear: '',
    profile_cause: '',
    profile_college_gradyear: '',
    profile_ctd_completed: '',
    profile_ctd_day1: '',
    profile_ctd_day2: '',
    profile_ctd_day3: '',
    profile_ctd_start: '',
    profile_date_of_birth: '2000-01-01',
    profile_edutype: '',
    profile_gambit_chatbot_response: 'Hi it\'s Freddie from DoSomething...',
    profile_sfw_day3: '',
    profile_source: 'Niche',
    profile_texting_frequency: '',
    args: '',
    keyword: 'BLINKMEUP',
    timestamp: '2017-04-19T13:35:56Z',
    message_id: '841415468',
    mdata_id: '14372',
    mms_image_url: '',
    phone_number_without_country_code: '15555225222',
  };
  const responseToFullPayload = await t.context.supertest
    .post('/api/v1/webhooks/gambit-chatbot-mdata')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(fullPayload);
  responseToFullPayload.status.should.be.equal(200);
  responseToFullPayload.body.should.have.property('ok', true);
});

/**
 * POST /api/v1/webhooks/customerio
 */
test('POST /api/v1/webhooks/moco-message-data should publish message to moco-message-data queue', async (t) => {
  const data = {
    random: 'key',
    nested: {
      random2: 'key2',
    },
  };

  const res = await t.context.supertest.post('/api/v1/webhooks/moco-message-data')
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
  // TODO: queue cleanup to make sure that it's not OLD message.
  const messages = await rabbit.getMessagesFrom('moco-message-data', 1);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

// ------- End -----------------------------------------------------------------
