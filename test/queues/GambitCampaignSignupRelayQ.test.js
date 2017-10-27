'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const GambitCampaignSignupRelayQ = require('../../src/queues/GambitCampaignSignupRelayQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test GambitCampaignSignupRelayQ
 */
test('GambitCampaignSignupRelayQ', (t) => {
  const queue = new GambitCampaignSignupRelayQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('gambit-campaign-signup-relay');
  queue.routes.should.include('signup.user.event');
});

// ------- End -----------------------------------------------------------------
