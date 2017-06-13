'use strict';

/**
 * Imports.
 */
const test = require('ava');
require('chai').should();

const QuasarCustomerIoEmailActivityQ = require('../../src/queues/QuasarCustomerIoEmailActivityQ');
const Queue = require('../../src/queues/Queue');

/**
 * Test QuasarCustomerIoEmailActivityQ class
 */
test.skip('QuasarCustomerIoEmailActivityQ', () => {
  const customerIoWebhookQ = new QuasarCustomerIoEmailActivityQ();
  customerIoWebhookQ.should.be.an.instanceof(Queue);
});
