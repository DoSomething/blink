'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const TwilioSmsInboundGambitRelayQ = require('../../../src/queues/TwilioSmsInboundGambitRelayQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test TwilioSmsInboundGambitRelayQ
 */
test('TwilioSmsInboundGambitRelayQ', () => {
  const queue = new TwilioSmsInboundGambitRelayQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('twilio-sms-inbound-gambit-relay');
  queue.routes.should.include('sms-inbound.twilio.webhook');
});

// ------- End -----------------------------------------------------------------
