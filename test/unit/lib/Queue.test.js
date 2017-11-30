'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Broker = require('../../../src/lib/brokers/Broker');
const Queue = require('../../../src/lib/Queue');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Queue: Test class interface
 */
test('Queue: Test class interface', () => {
  const queue = new Queue(new Broker());
  queue.should.respondTo('create');
  queue.should.respondTo('publish');
  queue.should.respondTo('nack');
  queue.should.respondTo('ack');
  queue.should.respondTo('purge');
  queue.should.respondTo('delete');
  queue.should.respondTo('subscribe');

  queue.should.have.property('routes');
  queue.routes.should.be.an('array').and.have.length.at.least(1);
});

// ------- End -----------------------------------------------------------------
