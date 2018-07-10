'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerIoSmsStatusActiveQ = require('../../../src/queues/CustomerIoSmsStatusActiveQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoSmsStatusActiveQ
 */
test('CustomerIoSmsStatusActiveQ', () => {
  const queue = new CustomerIoSmsStatusActiveQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('sms-status-active.customer-io.webhook');
});

// ------- End -----------------------------------------------------------------
