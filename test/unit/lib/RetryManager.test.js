'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// ------- Internal imports ----------------------------------------------------

const BlinkRetryError = require('../../../src/errors/BlinkRetryError');
const DelayLogic = require('../../../src/lib/delayers/DelayLogic');
const InMemoryRetryDelayer = require('../../../src/lib/delayers/InMemoryRetryDelayer');
const RetryDelayer = require('../../../src/lib/delayers/RetryDelayer');
const RetryManager = require('../../../src/lib/RetryManager');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');
const UnitHooksHelper = require('../../helpers/UnitHooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

// Setup blink app for each test.
test.beforeEach(UnitHooksHelper.createRandomQueueInMemory);
test.afterEach.always(UnitHooksHelper.destroyRandomQueueInMemory);

// ------- Tests ---------------------------------------------------------------

/**
 * RetryManager: constructor()
 */
test('RetryManager: Test class interface', (t) => {
  const retryManager = new RetryManager(t.context.queue);
  retryManager.should.respondTo('retry');
  retryManager.should.respondTo('delayLogic');
  retryManager.should.respondTo('log');
  retryManager.should.have.property('retryLimit');
  // Ensure default message delayers is InMemoryRetryDelayer.
  retryManager.retryDelayer.should.be.an.instanceof(RetryDelayer);
  retryManager.retryDelayer.should.be.an.instanceof(InMemoryRetryDelayer);
  // Ensure default retry delay logic is DelayLogic.exponentialBackoff
  retryManager.delayLogic.should.be.equal(DelayLogic.exponentialBackoff);

  // Ensure it's possible to override RetryDelayer.
  class CustomRetryDelayer extends RetryDelayer {}
  const retryDelayer = new CustomRetryDelayer();
  const retryManagerCustomRetryDelayer = new RetryManager(t.context.queue, retryDelayer);
  retryManagerCustomRetryDelayer.retryDelayer.should.be.an.instanceof(RetryDelayer);
  retryManagerCustomRetryDelayer.retryDelayer.should.be.an.instanceof(CustomRetryDelayer);
  retryManagerCustomRetryDelayer.retryDelayer.should.respondTo('delayMessageRetry');

  // Ensure it's possible to override DelayLogic.
  const customDelayLogic = currentRetryNumber => currentRetryNumber;
  const retryManagerCustomDelayLogic = new RetryManager(t.context.queue, false, customDelayLogic);
  retryManagerCustomDelayLogic.should.respondTo('delayLogic');
  retryManagerCustomDelayLogic.delayLogic.should.be.equal(customDelayLogic);
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
test('RetryManager.retry(): should delegate the delay procedure to an instance of RetryDelayer', async (t) => {
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

  // Stub RetryDelayer.delayMessageRetryStub().
  const delayMessageRetryStub = sinon.stub(retryManager.retryDelayer, 'delayMessageRetry');
  delayMessageRetryStub.resolves(true);

  // Pass the message to retry().
  const result = await retryManager.retry(message, retryError);
  result.should.be.true;

  // Ensure retry attempt has been increased by 1.
  // In example above, it will be 100.
  message.getRetryAttempt().should.equal(retryAttempt + 1);

  // Ensure delayMessageRetryStub() recived correct message and delay call.
  delayMessageRetryStub.should.have.been.calledWith(
    queue,
    message,
    DelayLogic.exponentialBackoff(retryAttempt + 1),
  );

  // Cleanup.
  delayMessageRetryStub.restore();
});

// ------- End -----------------------------------------------------------------
