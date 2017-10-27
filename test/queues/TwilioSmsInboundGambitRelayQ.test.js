'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const TwilioSmsInboundGambitRelayQ = require('../../src/queues/TwilioSmsInboundGambitRelayQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test TwilioSmsInboundGambitRelayQ
 */
test('TwilioSmsInboundGambitRelayQ', (t) => {
  const queue = new TwilioSmsInboundGambitRelayQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('twilio-sms-inbound-gambit-relay');
  queue.routes.should.include('sms-inbound.twilio.webhook');
});

// ------- End -----------------------------------------------------------------
