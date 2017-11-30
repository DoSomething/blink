'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerIoUpdateCustomerQ = require('../../../src/queues/CustomerIoUpdateCustomerQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoUpdateCustomerQ
 */
test('CustomerIoUpdateCustomerQ', () => {
  const queue = new CustomerIoUpdateCustomerQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-update-customer');
  queue.routes.should.include('create.user.event');
});

// ------- End -----------------------------------------------------------------
