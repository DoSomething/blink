'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');

const RabbitManagement = require('../../helpers/RabbitManagement');
const HooksHelper = require('../../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

/**
 * POST /api/v1/webhooks/twilio-sms-broadcast
 *
 * Temporary moved from WebHooksWebController.test.js to make it run
 * serial with rate limiter test to avoid interference.
 */
test('POST /api/v1/webhooks/twilio-sms-broadcast should publish message to twilio-sms-broadcast-gambit-relay queue', async (t) => {
  await HooksHelper.startBlinkWebApp(t);

  const data = {
    random: 'key',
    nested: {
      random2: 'key2',
    },
  };

  const broadcastId = chance.word();

  const res = await t.context.supertest.post('/api/v1/webhooks/twilio-sms-broadcast')
    .query({ broadcastId })
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  // Ensure TwiML compatible response.
  res.status.should.be.equal(204);
  res.res.statusMessage.toLowerCase().should.equal('no content');
  res.header.should.not.have.property('content-type');
  res.text.should.equal('');

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  const messages = await rabbit.getMessagesFrom('twilio-sms-broadcast-gambit-relay', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);

  // Check broadcast id.
  messageData.should.have.property('meta');
  messageData.meta.should.have.property('query');
  messageData.meta.query.should.have.property('broadcastId', broadcastId);

  await HooksHelper.stopBlinkWebApp(t);
});

// ------- End -----------------------------------------------------------------
