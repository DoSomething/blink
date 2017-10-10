'use strict';

// ------- Imports -------------------------------------------------------------

const chai = require('chai');
const Chance = require('chance');
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
const test = require('ava');
const uuidV4 = require('uuid/v4');

const TwilioStatusCallbackMessage = require('../../src/messages/TwilioStatusCallbackMessage');
const BlinkWorkerApp = require('../../src/app/BlinkWorkerApp');
const TwilioSmsBroadcastGambitRelayWorker = require('../../src/workers/TwilioSmsBroadcastGambitRelayWorker');
const HooksHelper = require('../helpers/HooksHelper');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach(HooksHelper.startBlinkApp);

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
  await new Promise(resolve => setTimeout(resolve, 100));

  // Create gambit worker
  // const config = require('../../config');
  // const blinkWorkerApp = new BlinkWorkerApp(config, 'twilio-sms-broadcast-gambit-relay');

  // var consumeSpy = sinon.spy();
  // // Override consume function with sinon spy
  // blinkWorkerApp.worker.consume = consumeSpy;
  // await blinkWorkerApp.reconnect();

  // spy.should.have.callCount(consumeSpy);

  const worker = new TwilioSmsBroadcastGambitRelayWorker(t.context.blink);
  var consumeSpy = sinon.spy();
  worker.consume = consumeSpy;

  worker.setup();
  worker.perform();

  consumeSpy.should.have.callCount(100);
});

// ------- End -----------------------------------------------------------------
