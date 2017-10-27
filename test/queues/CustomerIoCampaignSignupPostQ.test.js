'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const CustomerIoCampaignSignupPostQ = require('../../src/queues/CustomerIoCampaignSignupPostQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoCampaignSignupPostQ
 */
test('CustomerIoCampaignSignupPostQ', (t) => {
  const queue = new CustomerIoCampaignSignupPostQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-campaign-signup-post');
  queue.routes.should.include('signup-post.user.event');
});

// ------- End -----------------------------------------------------------------
