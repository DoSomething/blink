'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const CustomerIoCampaignSignupQ = require('../../src/queues/CustomerIoCampaignSignupQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoCampaignSignupQ
 */
test('CustomerIoCampaignSignupQ', (t) => {
  const queue = new CustomerIoCampaignSignupQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-campaign-signup');
  queue.routes.should.include('signup.user.event');
});

// ------- End -----------------------------------------------------------------
