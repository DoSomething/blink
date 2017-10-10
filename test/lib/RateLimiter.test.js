'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');
const uuidV4 = require('uuid/v4');

const TwilioStatusCallbackMessage = require('../../src/messages/TwilioStatusCallbackMessage');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

test('Gambit Broadcast relay should be consume 100 messages per second exactly', () => {
  // const config = require('../../config');
  // const gambitWorkerApp = new BlinkWorkerApp(config, 'twilio-sms-broadcast-gambit-relay');
  // const gambitWorker = gambitWorkerApp.worker;

  // Publish 1000 messages to the queue
  for (let i = 0; i < 1000; i++) {
    const data = MessageFactoryHelper.getRandomDataSample();
    const freeFormMessage = new TwilioStatusCallbackMessage({
      data,
      meta: {
        request_id: uuidV4(),
        broadcastId: chance.word(),
      },
    })
    this.blink.exchange.publish(
      'sms-broadcast.status-callback.twilio.webhook',
      message,
    );
  }
});

// ------- End -----------------------------------------------------------------
