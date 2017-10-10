'use strict';

// ------- Imports -------------------------------------------------------------

const chai = require('chai');
const Chance = require('chance');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const test = require('ava');
const uuidV4 = require('uuid/v4');

const TwilioStatusCallbackMessage = require('../../src/messages/TwilioStatusCallbackMessage');
const TwilioSmsBroadcastGambitRelayWorker = require('../../src/workers/TwilioSmsBroadcastGambitRelayWorker');
const HooksHelper = require('../helpers/HooksHelper');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

// Turn off extra logs for this tests, as it genertes thouthands of messages.
process.env.LOGGER_LEVEL = 'info';
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

test('Gambit Broadcast relay should be consume 100 messages per second exactly', async (t) => {
  // Publish 1000 messages to the queue
  for (let i = 0; i < 100; i++) {
    const data = MessageFactoryHelper.getRandomDataSample();
    const message = new TwilioStatusCallbackMessage({
      data,
      meta: {
        request_id: uuidV4(),
        broadcastId: chance.word(),
      },
    });
    t.context.blink.exchange.publish(
      'sms-broadcast.status-callback.twilio.webhook',
      message,
    );
  }

  // Wait for 1 sec for messags to sync in to Rabbit.
  // await new Promise(resolve => setTimeout(resolve, 100));

  const worker = new TwilioSmsBroadcastGambitRelayWorker(t.context.blink);

  // Replace consume function with a spy.
  const consumeSpy = sinon.spy();
  worker.consume = consumeSpy;

  // Kick off message consuming;
  worker.setup();
  worker.perform();

  // Ensure that after one second worker consumed exactly 10 messages.
  await new Promise((resolve) => {
    setTimeout(() => {
      consumeSpy.should.have.callCount(30);
      resolve();
    }, 3000);
  });
});

// ------- End -----------------------------------------------------------------
