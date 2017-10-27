'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const BlinkRetryError = require('../../src/errors/BlinkRetryError');
const RetryManager = require('../../src/lib/RetryManager');
const DelayLogic = require('../../src/lib/DelayLogic');
const HooksHelper = require('../helpers/HooksHelper');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

// Setup blink app for each test.
test.beforeEach(HooksHelper.createRandomQueueInMemory);
test.afterEach.always(HooksHelper.destroyRandomQueueInMemory);

// ------- Tests ---------------------------------------------------------------

/**
 * RetryManager: constructor()
 */
test('RetryManager: Test class interface', (t) => {
  const retryManager = new RetryManager(t.context.queue);
  retryManager.should.respondTo('retry');
  retryManager.should.respondTo('retryAttemptToDelayTime');
  retryManager.should.respondTo('republishWithDelay');
  retryManager.should.respondTo('log');
  retryManager.should.have.property('retryLimit');
  // Ensure default retry delay logic is DelayLogic.exponentialBackoff
  retryManager.retryAttemptToDelayTime.should.be.equal(DelayLogic.exponentialBackoff);

  // Ensure it's possible to override DelayLogic
  const customDelayLogic = currentRetryNumber => currentRetryNumber;
  const retryManagerCustom = new RetryManager(t.context.queue, customDelayLogic);
  retryManagerCustom.should.respondTo('retryAttemptToDelayTime');
  retryManagerCustom.retryAttemptToDelayTime.should.be.equal(customDelayLogic);
});

/**
 * RetryManager.retry()
 */
test('RetryManager.retry(): ensure nack when retry limit is reached', async (t) => {
  const queue = t.context.queue;
  // Stub queue method to ensure nack() will be called.
  const ackStub = sinon.stub(queue, 'ack').returns(null);
  const nackStub = sinon.stub(queue, 'nack').returns(null);

  // Create retryManager.
  const retryManager = new RetryManager(queue);

  // Prepare retry message for the manager.
  const message = MessageFactoryHelper.getRandomMessage();
  const retryError = new BlinkRetryError('Testing BlinkRetryError', message);
  // Set current retry attempt to the limit set in the manager + 1.
  message.getMeta().retryAttempt = retryManager.retryLimit + 1;

  // Pass the message to retry().
  const result = await retryManager.retry(message, retryError);
  result.should.be.false;

  // Make sure the message has been nacked.
  ackStub.should.not.have.been.called;
  nackStub.should.have.been.calledWith(message);

  // Cleanup.
  ackStub.restore();
  nackStub.restore();
});

/**
 * RetryManager.retry()
 */
test('RetryManager.retry(): should call republishWithDelay with correct params', async (t) => {
  const queue = t.context.queue;

  // Create retryManager.
  const retryManager = new RetryManager(queue);

  // Prepare retry message for the manager.
  const message = MessageFactoryHelper.getRandomMessage();
  const retryError = new BlinkRetryError('Testing BlinkRetryError', message);
  // Set current retry attempt to the limit set in the manager - 1.
  // For example, if the limit is 100, we'll test retryAttempt = 99.
  const retryAttempt = retryManager.retryLimit - 1;
  message.getMeta().retryAttempt = retryAttempt;

  // Stub republishWithDelay.
  const republishWithDelayStub = sinon.stub(retryManager, 'republishWithDelay');
  republishWithDelayStub.resolves(true);

  // Pass the message to retry().
  const result = await retryManager.retry(message, retryError);
  result.should.be.true;

  // Ensure retry attempt has been increased by 1.
  // In example above, it will be 100.
  message.getRetryAttempt().should.equal(retryAttempt + 1);

  // Ensure republishWithDelay() recived correct message and delay call.
  republishWithDelayStub.should.have.been.calledWith(
    message,
    DelayLogic.exponentialBackoff(retryAttempt + 1),
  );

  // Cleanup.
  republishWithDelayStub.restore();
});

/**
 * RetryManager.republishWithDelay()
 */
test('RetryManager.republishWithDelay(): should republish original message', async (t) => {
  const queue = t.context.queue;
  // Stub queue method to ensure nack() will be called.
  const nackStub = sinon.stub(queue, 'nack').returns(null);
  const publishStub = sinon.stub(queue, 'publish').returns(null);

  // Create retryManager.
  const retryManager = new RetryManager(queue);

  // Prepare retry message for the manager.
  const message = MessageFactoryHelper.getRandomMessage();
  const retryError = new BlinkRetryError('Testing BlinkRetryError', message);
  message.incrementRetryAttempt(retryError.message);


  // Fake clock so we don't have to wait on this implementation,
  // but still are providing real wait time.
  const waitTime = 60 * 1000; // 60s.
  const clock = sinon.useFakeTimers();

  // Request message republish in 60s.
  const resultPromise = retryManager.republishWithDelay(message, waitTime);

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
