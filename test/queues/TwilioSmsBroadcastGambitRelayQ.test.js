'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const TwilioSmsBroadcastGambitRelayQ = require('../../src/queues/TwilioSmsBroadcastGambitRelayQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test TwilioSmsBroadcastGambitRelayQ
 */
test('TwilioSmsBroadcastGambitRelayQ', (t) => {
  const queue = new TwilioSmsBroadcastGambitRelayQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('twilio-sms-broadcast-gambit-relay');
  queue.routes.should.include('sms-broadcast.status-callback.twilio.webhook');
});

// ------- End -----------------------------------------------------------------
