'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const CustomerIoCampaignSignupQ = require('../../../src/queues/CustomerIoCampaignSignupQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerIoCampaignSignupQ
 */
test('CustomerIoCampaignSignupQ', () => {
  const queue = new CustomerIoCampaignSignupQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customer-io-campaign-signup');
  queue.routes.should.include('signup.user.event');
});

// ------- End -----------------------------------------------------------------
