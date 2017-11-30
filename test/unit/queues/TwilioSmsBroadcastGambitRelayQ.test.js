'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const TwilioSmsBroadcastGambitRelayQ = require('../../../src/queues/TwilioSmsBroadcastGambitRelayQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test TwilioSmsBroadcastGambitRelayQ
 */
test('TwilioSmsBroadcastGambitRelayQ', () => {
  const queue = new TwilioSmsBroadcastGambitRelayQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('twilio-sms-broadcast-gambit-relay');
  queue.routes.should.include('sms-broadcast.status-callback.twilio.webhook');
});

// ------- End -----------------------------------------------------------------
