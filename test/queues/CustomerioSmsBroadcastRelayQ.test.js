'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const CustomerioSmsBroadcastRelayQ = require('../../src/queues/CustomerioSmsBroadcastRelayQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test CustomerioSmsBroadcastRelayQ
 */
test('CustomerioSmsBroadcastRelayQ', (t) => {
  const queue = new CustomerioSmsBroadcastRelayQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('customerio-sms-broadcast-relay');
});

// ------- End -----------------------------------------------------------------
