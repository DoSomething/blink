'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');
const moment = require('moment');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const BlinkApp = require('../../../src/app/BlinkApp');
const BlinkRetryError = require('../../../src/errors/BlinkRetryError');
const Queue = require('../../../src/lib/Queue');
const DelayLogic = require('../../../src/lib/delayers/DelayLogic');
const FreeFormMessage = require('../../../src/messages/FreeFormMessage');
const RedisRetriesRepublishTimerTask = require('../../../src/timers/RedisRetriesRepublishTimerTask');
const Worker = require('../../../src/workers/Worker');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

test.serial('RedisRetriesRepublishTimerTask Test full message cycle. ', async () => {
  // ***************************************************************************
  // 0. Initial setup
  const config = require('../../../config');
  // Override redis retry set name.
  // WARNING: this could interfier with other tests in this file.
  config.redis.settings.retrySet = `test-full-message-${chance.word()}`;

  // Start blink app.
  const blink = new BlinkApp(config);
  await blink.start();

  // Cleanup redis set in case it has unprocess data from
  // the previous unseccesfull test
  await blink.redis.getClient().del(blink.config.redis.settings.retrySet);

  // Sinon setup.
  const startTime = moment('1988-05-28');
  const sandbox = sinon.createSandbox();
  sandbox.useFakeTimers({
    // Need for our own waits using setTimeout().
    shouldAdvanceTime: true,
    // Set fake timers at non-zero date.
    now: startTime.valueOf(),
  });

  // Create test queue and register it in Blink app.
  class RetryTestQ extends Queue {
    constructor(...args) {
      super(...args);
      this.messageClass = FreeFormMessage;
    }
  }
  const retryTestQ = new RetryTestQ(blink.broker);
  const ackSpy = sandbox.spy(retryTestQ, 'ack');
  const publishSpy = sandbox.spy(retryTestQ, 'publish');
  await retryTestQ.create();
  const registryName = BlinkApp.generateQueueRegistryKey(RetryTestQ);
  blink.queues[registryName] = retryTestQ;

  // Purge the queue in case it existed.
  await retryTestQ.purge();

  // Retry worker test class.
  class RetryTestWorker extends Worker {
    /* eslint-disable no-unused-vars, class-methods-use-this, no-empty-function */
    setup() {
      super.setup({ queue: this.blink.queues.retryTestQ });
    }
    async consume() {}
    /* eslint-enable */
  }

  // ***************************************************************************
  // 1. Publish message to the queue *******************************************
  const testMessage = MessageFactoryHelper.getRandomMessage(true);
  const initialRetryAttempt = 50;
  // Expected delay for the following retry attempt, ms.
  const expectedDelay = DelayLogic.exponentialBackoff(initialRetryAttempt + 1);
  // Expected time to return, UNIX time.
  const expectedRepublishTime = startTime.unix() + Math.round(expectedDelay / 1000);
  testMessage.getMeta().retryAttempt = initialRetryAttempt;
  retryTestQ.publish(testMessage);

  // ***************************************************************************
  // 2. Start the worker and send the message for a retry **********************
  // Create a worker app to consume this message from the queue.
  const worker = new RetryTestWorker(blink);
  const consumeStub = sandbox.stub(worker, 'consume');
  // First call should request a retry for this message.
  consumeStub.onCall(0).callsFake((message) => {
    throw new BlinkRetryError('Testing retries', message);
  });
  // On second call, we accept the message.
  consumeStub.onCall(1).resolves(true);

  // Setup worker, including dealing infrastructure.
  worker.setup();
  // Spy on the delay infrastructure API call.
  const delayMessageRetrySpy = sandbox.spy(worker.retryDelayer, 'delayMessageRetry');
  const saveMessageToRedisSpy = sandbox.spy(worker.retryDelayer, 'saveMessageToRedis');
  // Start consuming messages from the queue.
  worker.start();

  // ***************************************************************************
  // 3. Ensure message has been saved to Redis and removed from the queue *******
  // Wait for the actual message processing.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // ** Check Worker.consume() **
  // Consume callback should have been called.
  consumeStub.should.have.been.calledOnce;

  // ** Check RedisRetryDelayer.delayMessageRetry() **
  // Delay message retry should have been called for the test messages.
  delayMessageRetrySpy.should.have.been.calledOnce;
  const [delayQArg, delayMessageArg, delayMsArg] = delayMessageRetrySpy.firstCall.args;
  delayQArg.should.equal(retryTestQ);
  delayMessageArg.getData().should.eql(testMessage.getData());
  delayMsArg.should.be.equal(expectedDelay);

  // ** Check RedisRetryDelayer.saveMessageToRedis() **
  // Ensure republishTime is within expected values.
  saveMessageToRedisSpy.should.have.been.calledOnce;
  const [packedMessageArg, republishTimeArg] = saveMessageToRedisSpy.firstCall.args;
  // Just double check it's the same message
  packedMessageArg.should.have.string(testMessage.getRequestId());
  // Calculated republish time should be withing one second of the expected.
  republishTimeArg.should.be.closeTo(expectedRepublishTime, 1);

  // ** Check Queue.ack() **
  // Messages should have been removed from the original queue.
  ackSpy.should.have.been.calledOnce;
  const [ackFirstCallMessageArg] = ackSpy.firstCall.args;
  // Ensure it's the same message.
  ackFirstCallMessageArg.getData().should.eql(testMessage.getData());

  // ***************************************************************************
  // 4. Start the timer to get the message back the queue **********************
  // Create new republisher timer task.
  const timer = new RedisRetriesRepublishTimerTask(blink);
  timer.setup();
  // Spy on run method.
  const timerRunSpy = sandbox.spy(timer, 'run');
  // Advance the clock to the expected time of returning the message.
  // Converting it to milliseconds
  sandbox.clock.tick((expectedRepublishTime + 1) * 1000);
  timer.start();
  // Wait for the messages to be processed from Redis.
  // Could take a while.
  await new Promise(resolve => setTimeout(resolve, 3000));
  // Stop the timer.
  timer.stop();
  // Ensure the run function has been executed at least once.
  timerRunSpy.callCount.should.be.above(0);
  // Ensure the message has been republished to the top of the queue.
  publishSpy.should.have.been.calledTwice;
  // First call was when we published message originally.
  const [publishMessageArg, publishPriorityArg] = publishSpy.secondCall.args;
  publishMessageArg.getData().should.eql(testMessage.getData());
  publishPriorityArg.should.be.equal('HIGH');
  // Ensure the message is of correct instance.
  publishMessageArg.should.be.an.instanceOf(FreeFormMessage);
  // Ensure the message got delivered back to the consumer.
  consumeStub.should.have.been.calledTwice;
  const [returnedMessageArg] = publishSpy.secondCall.args;
  returnedMessageArg.getData().should.eql(testMessage.getData());
  returnedMessageArg.getRetryAttempt().should.be.equal(initialRetryAttempt + 1);
  // Ensure the message eventually got acknowledged.
  ackSpy.should.have.been.calledTwice;
  const [ackSecondCallMessageArg] = ackSpy.secondCall.args;
  // Ensure it's the same message.
  ackSecondCallMessageArg.getData().should.eql(testMessage.getData());

  // ***************************************************************************
  // 5. Cleanup
  sandbox.restore();
  await blink.redis.getClient().del(blink.config.redis.settings.retrySet);
  await blink.stop();
});

// ------- End -----------------------------------------------------------------
