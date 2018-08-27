'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const QuasarCustomerIoEmailActivityQ = require('../../../src/queues/QuasarCustomerIoEmailActivityQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test QuasarCustomerIoEmailActivityQ
 */
test('QuasarCustomerIoEmailActivityQ', () => {
  const queue = new QuasarCustomerIoEmailActivityQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('quasar-customer-io-email-activity');
  queue.routes.should.include('*.event.quasar');
});

// ------- End -----------------------------------------------------------------
