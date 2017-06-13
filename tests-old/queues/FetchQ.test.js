'use strict';

/**
 * Imports.
 */
const test = require('ava');
require('chai').should();

const FetchQ = require('../../src/queues/FetchQ');
const Queue = require('../../src/queues/Queue');

/**
 * Test FetchQ class
 */
test.skip('FetchQ', () => {
  const fetchQ = new FetchQ();
  fetchQ.should.be.an.instanceof(Queue);
});
