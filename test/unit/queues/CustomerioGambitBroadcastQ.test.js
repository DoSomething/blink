'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerioGambitBroadcastQ = require('../../../src/queues/CustomerioGambitBroadcastQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerioSmsBroadcastRelayQ
 */
test('CustomerioGambitBroadcastQ', () => {
  const queue = new CustomerioGambitBroadcastQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customerio-gambit-broadcast');
});

// ------- End -----------------------------------------------------------------
