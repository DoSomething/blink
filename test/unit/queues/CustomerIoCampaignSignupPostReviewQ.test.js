'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerIoCampaignSignupPostReviewQ = require('../../../src/queues/CustomerIoCampaignSignupPostReviewQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoCampaignSignupPostReviewQ
 */
test('CustomerIoCampaignSignupPostReviewQ', () => {
  const queue = new CustomerIoCampaignSignupPostReviewQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-campaign-signup-post-review');
  queue.routes.should.include('signup-post-review.user.event');
});

// ------- End -----------------------------------------------------------------
