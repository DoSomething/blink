'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerIoCampaignSignupPostQ = require('../../../src/queues/CustomerIoCampaignSignupPostQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoCampaignSignupPostQ
 */
test('CustomerIoCampaignSignupPostQ', () => {
  const queue = new CustomerIoCampaignSignupPostQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-campaign-signup-post');
  queue.routes.should.include('signup-post.user.event');
});

// ------- End -----------------------------------------------------------------
