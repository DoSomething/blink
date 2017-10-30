'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');
const fetch = require('node-fetch');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const RabbitManagement = require('../../src/lib/RabbitManagement');
const BlinkWorkerApp = require('../../src/app/BlinkWorkerApp');
const TwilioStatusCallbackMessage = require('../../src/messages/TwilioStatusCallbackMessage');
const TwilioSmsBroadcastGambitRelayWorker = require('../../src/workers/TwilioSmsBroadcastGambitRelayWorker');
const HooksHelper = require('../helpers/HooksHelper');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

const chance = new Chance();
const { Response } = fetch;

// ------- Tests ---------------------------------------------------------------

test.serial('Gambit Broadcast relay should recieve correct retry count if message has been retried', () => {
  const config = require('../../config');
  const gambitWorkerApp = new BlinkWorkerApp(config, 'twilio-sms-broadcast-gambit-relay');
  const gambitWorker = gambitWorkerApp.worker;

  // No retry property:
  gambitWorker.getRequestHeaders(MessageFactoryHelper.getValidMessageData())
    .should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getValidMessageData();
  gambitWorker.getRequestHeaders(retriedZero)
    .should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getValidMessageData();
  retriedOnce.incrementRetryAttempt();
  gambitWorker.getRequestHeaders(retriedOnce)
    .should.have.property('x-blink-retry-count').and.equal(1);
});


test.serial('Test Gambit response with x-blink-retry-suppress header', () => {
  const config = require('../../config');
  const gambitWorkerApp = new BlinkWorkerApp(config, 'twilio-sms-broadcast-gambit-relay');
  const gambitWorker = gambitWorkerApp.worker;

  // Gambit order retry suppression
  const retrySuppressResponse = new Response(
    'Unknown Gambit error',
    {
      status: 422,
      statusText: 'Unknown Gambit error',
      headers: {
        // Also make sure that blink recongnizes non standart header case
        'X-BlInK-RetRY-SuPPRESS': 'TRUE',
      },
    },
  );

  gambitWorker.checkRetrySuppress(retrySuppressResponse).should.be.true;


  // Normal Gambit 422 response
  const normalFailedResponse = new Response(
    'Unknown Gambit error',
    {
      status: 422,
      statusText: 'Unknown Gambit error',
      headers: {
        'x-taco-count': 'infinity',
      },
    },
  );
  gambitWorker.checkRetrySuppress(normalFailedResponse).should.be.false;
});

test.serial('Gambit should process delivered messages', () => {
  const messageData = MessageFactoryHelper.getValidMessageData();
  messageData.payload.data.MessageStatus = 'delivered';
  TwilioSmsBroadcastGambitRelayWorker.shouldSkip(messageData).should.be.false;
});

test.serial('Gambit should not process not inbound messages', () => {
  const messageData = MessageFactoryHelper.getValidMessageData();
  messageData.payload.data.MessageStatus = 'other';
  TwilioSmsBroadcastGambitRelayWorker.shouldSkip(messageData).should.be.true;
});

test.serial('Gambit Broadcast relay should be consume close to 60 messages per second', async (t) => {
  // Turn off extra logs for this tests, as it genertes thouthands of messages.
  await HooksHelper.startBlinkWebApp(t);
  const blink = t.context.blink;

  // Publish 2x rate limit messages to the queue
  for (let i = 0; i < 120; i++) {
    const data = MessageFactoryHelper.getRandomDataSample();
    const meta = {
      request_id: chance.guid({ version: 4 }),
      broadcastId: chance.word(),
    };
    const message = new TwilioStatusCallbackMessage({ data, meta });
    blink.exchange.publish('sms-broadcast.status-callback.twilio.webhook', message);
  }

  // Wait for all messages to sync into rabbit.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Spy on worker's consume();
  const worker = new TwilioSmsBroadcastGambitRelayWorker(blink);
  const consumeStub = sinon.stub(worker, 'consume').resolves(true);

  // Kick off message consuming;
  worker.setup();
  worker.perform();

  // Ensure that after one second worker consumed close to 60 messages.
  // = expected rate, 60 messages per second!
  // Wait for all messages to sync into rabbit.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check that call count is below the rate limit.
  consumeStub.callCount.should.be.below(60);

  // Await consuming to complete
  // @todo: gracefull worker shutdown instead.
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Cleanup
  consumeStub.restore();
  await HooksHelper.stopBlinkWebApp(t);
});

/**
 * POST /api/v1/webhooks/twilio-sms-broadcast
 *
 * Temporary moved from WebHooksWebController.test.js to make it run
 * serial with rate limiter test to avoid interference.
 */
test.serial('POST /api/v1/webhooks/twilio-sms-broadcast should publish message to twilio-sms-broadcast-gambit-relay queue', async (t) => {
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
