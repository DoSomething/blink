'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Queue = require('../../src/lib/Queue');
const GambitChatbotMdataQ = require('../../src/queues/GambitChatbotMdataQ');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Test GambitChatbotMdataQ
 */
test('GambitChatbotMdataQ', (t) => {
  const queue = new GambitChatbotMdataQ(t.context.blink.exchange);
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('gambit-chatbot-mdata');
});

// ------- End -----------------------------------------------------------------
