'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerioSmsBroadcastRelayQ = require('../../../src/queues/CustomerioSmsBroadcastRelayQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerioSmsBroadcastRelayQ
 */
test('CustomerioSmsBroadcastRelayQ', () => {
  const queue = new CustomerioSmsBroadcastRelayQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customerio-sms-broadcast-relay');
});

// ------- End -----------------------------------------------------------------
