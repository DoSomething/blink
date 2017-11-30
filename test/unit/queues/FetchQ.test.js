'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');
const FetchQ = require('../../../src/queues/FetchQ');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Test FetchQ
 */
test('FetchQ', () => {
  const queue = new FetchQ(new Broker());
  queue.should.be.an.instanceof(Queue);
  queue.routes.should.include('fetch');
});

// ------- End -----------------------------------------------------------------
