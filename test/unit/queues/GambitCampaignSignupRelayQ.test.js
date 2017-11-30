'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const GambitCampaignSignupRelayQ = require('../../../src/queues/GambitCampaignSignupRelayQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test GambitCampaignSignupRelayQ
 */
test('GambitCampaignSignupRelayQ', () => {
  const queue = new GambitCampaignSignupRelayQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('gambit-campaign-signup-relay');
  queue.routes.should.include('signup.user.event');
});

// ------- End -----------------------------------------------------------------
