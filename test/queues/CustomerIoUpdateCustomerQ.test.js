'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const CustomerIoUpdateCustomerQ = require('../../src/queues/CustomerIoUpdateCustomerQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoUpdateCustomerQ
 */
test('CustomerIoUpdateCustomerQ', (t) => {
  const queue = new CustomerIoUpdateCustomerQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-update-customer');
  queue.routes.should.include('create.user.event');
});

// ------- End -----------------------------------------------------------------
