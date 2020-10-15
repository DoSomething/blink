'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const RabbitManagement = require('../../../helpers/RabbitManagement');
const HooksHelper = require('../../../helpers/HooksHelper');
const MessageFactoryHelper = require('../../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
test.beforeEach(HooksHelper.startBlinkWebApp);
test.afterEach(HooksHelper.stopBlinkWebApp);

// ------- Tests ---------------------------------------------------------------

/**
 * GET /api/v1/events
 */
test('GET /api/v1/events should respond with JSON list available tools', async (t) => {
  const res = await t.context.supertest.get('/api/v1/events')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);

  // Check response to be json
  res.header.should.have.property('content-type')
    .and.have.string('application/json');

  // Check response.
  // TODO: map key to destination and check them in loop.

  res.body.should.have.property('quasar-relay')
    .and.have.string('/api/v1/events/quasar-relay');
});

/**
 * POST /api/v1/events/quasar-relay
 */
test.serial('POST /api/v1/events/quasar-relay should save message as is to quasar queue', async (t) => {
  const data = MessageFactoryHelper.getRandomDataSample();

  const res = await t.context.supertest.post('/api/v1/events/quasar-relay')
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

  // TODO: quasar-customer-io-email-activity to be renamed.
  // See https://github.com/DoSomething/blink/issues/99
  // See https://www.pivotaltracker.com/story/show/150330459
  const messages = await rabbit.getMessagesFrom('quasar-customer-io-email-activity', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');

  // Required.
  messageData.data.should.deep.equal(data);
});


// ------- End -----------------------------------------------------------------
