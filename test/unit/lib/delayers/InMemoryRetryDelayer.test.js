'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// ------- Internal imports ----------------------------------------------------

const InMemoryRetryDelayer = require('../../../../src/lib/delayers/InMemoryRetryDelayer');
const RetryDelayer = require('../../../../src/lib/delayers/RetryDelayer');
const MessageFactoryHelper = require('../../../helpers/MessageFactoryHelper');
const UnitHooksHelper = require('../../../helpers/UnitHooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

// Setup blink app for each test.
test.beforeEach(UnitHooksHelper.createRandomQueueInMemory);
test.afterEach.always(UnitHooksHelper.destroyRandomQueueInMemory);

// ------- Tests ---------------------------------------------------------------

/**
 * InMemoryRetryDelayer: constructor()
 */
test('InMemoryRetryDelayer: Test class interface', () => {
  const inMemoryRetryDelayer = new InMemoryRetryDelayer();
  inMemoryRetryDelayer.should.be.an.instanceof(RetryDelayer);
  inMemoryRetryDelayer.should.respondTo('delayMessageRetry');
});

/**
 * InMemoryRetryDelayer.delayMessageRetry()
 */
test('InMemoryRetryDelayer.delayMessageRetry(): should republish original message', async (t) => {
  const queue = t.context.queue;
  // Stub queue method to ensure nack() will be called.
  const nackStub = sinon.stub(queue, 'nack').returns(null);
  const publishStub = sinon.stub(queue, 'publish').returns(null);

  // Create InMemoryRetryDelayer.
  const inMemoryRetryDelayer = new InMemoryRetryDelayer();

  // Prepare retry message for the manager.
  const message = MessageFactoryHelper.getRandomMessage();


  // Fake clock so we don't have to wait on this implementation,
  // but still are providing real wait time.
  const waitTime = 60 * 1000; // 60s.
  const clock = sinon.useFakeTimers();

  // Request message republish in 60s.
  const resultPromise = inMemoryRetryDelayer.delayMessageRetry(queue, message, waitTime);

  // Advace the clock to wait time before actually waiting on promise.
  clock.tick(waitTime);

  // Should be resolved immidiatelly.
  const result = await resultPromise;
  // Important: reset the clock.
  clock.restore();

  // Unless error is thrown, result will be true.
  result.should.be.true;

  // Make sure message hasn been nackd and then republished again.
  nackStub.should.have.been.calledWith(message);
  publishStub.should.have.been.calledWith(message);

  // Cleanup.
  nackStub.restore();
  publishStub.restore();
});

// ------- End -----------------------------------------------------------------
