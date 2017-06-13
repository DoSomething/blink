'use strict';

/**
 * Imports.
 */
const test = require('ava');
require('chai').should();

const CustomerIoUpdateCustomerQ = require('../../src/queues/CustomerIoUpdateCustomerQ');
const Queue = require('../../src/queues/Queue');

/**
 * Test CustomerIoUpdateCustomerQ class
 */
test.skip('CustomerIoUpdateCustomerQ', () => {
  const customerIoUpdateCustomerQ = new CustomerIoUpdateCustomerQ();
  customerIoUpdateCustomerQ.should.be.an.instanceof(Queue);
});
