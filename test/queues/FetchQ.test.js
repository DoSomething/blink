'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const FetchQ = require('../../src/queues/FetchQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test FetchQ
 */
test('FetchQ', (t) => {
  const queue = new FetchQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('fetch');
});

// ------- End -----------------------------------------------------------------
