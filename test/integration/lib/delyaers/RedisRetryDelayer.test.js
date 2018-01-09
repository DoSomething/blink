'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const RedisRetryDelayer = require('../../../../src/lib/delayers/RedisRetryDelayer');
const HooksHelper = require('../../../helpers/HooksHelper');
const MessageFactoryHelper = require('../../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

test.beforeEach(HooksHelper.startRedis);
test.afterEach(HooksHelper.stopRedis);
test.beforeEach(HooksHelper.createRandomQueue);
test.afterEach(HooksHelper.destroyRandomQueue);

// ------- Tests ---------------------------------------------------------------

/**
 * RedisRetryDelayer.delayMessageRetry()
 */
test('RedisRetryDelayer.delayMessageRetry(): Should save message to redis queue', async (t) => {
  // Set variables from the context.
  const { redis, queue } = t.context;

  // Sinon sandbox.
  const sandbox = sinon.createSandbox();

  // Define test parameters.
  const redisClient = redis.getClient();
  const delayer = new RedisRetryDelayer(redisClient, redis.settings);
  const message = MessageFactoryHelper.getRandomMessage(true);
  const delayMs = 1000;

  // Stub queue's acknowledge message: we don't need to actually acknowledge
  // the message.
  const ackStub = sandbox.stub(queue, 'ack').returns(undefined);

  // Call the delayer.
  await delayer.delayMessageRetry(queue, message, delayMs);

  // Ensure delayer removed the message from the queue.
  ackStub.should.have.been.calledOnce;

  // Ensure the message has been saved to redis.
  // Request 10 messages, but expect only one to return.
  const redisMessages = await redisClient.zrange(redis.settings.retrySet, 0, 10);

  // Check the response.
  redisMessages.should.have.lengthOf(1);
  // Unpack first message.
  const messagePayload = JSON.parse(redisMessages[0]);
  // Ensure we got the same message.
  messagePayload.data.should.eql(message.getData());

  // Restore stubbed functions.
  sandbox.restore();
});

/**
 * RedisRetryDelayer.getReadyMessages()
 */
test('RedisRetryDelayer.getReadyMessages(): Ensure messages will not be returned prematurly', async (t) => {
  // Set variables from the context.
  const { redis, queue } = t.context;

  // Sinon sandbox.
  const sandbox = sinon.createSandbox();

  // Define test parameters.
  const redisClient = redis.getClient();
  const delayer = new RedisRetryDelayer(redisClient, redis.settings);

  // Prepare 2 messages: one to be returned immidiatelly,
  // second to be returned in an hor.
  const shortDelayMessage = MessageFactoryHelper.getRandomMessage(true);
  const longDelayMessage = MessageFactoryHelper.getRandomMessage(true);
  // Should be immidiatelly returned.
  const shortDelayMs = 1;
  // Assuming this test will not run for an hour :)
  const longDelayMs = 1000 * 3600;

  // Stub queue's acknowledge message: we don't need to actually acknowledge
  // the message.
  const ackStub = sandbox.stub(queue, 'ack').returns(undefined);

  // Call the delayer.
  await delayer.delayMessageRetry(queue, shortDelayMessage, shortDelayMs);
  await delayer.delayMessageRetry(queue, longDelayMessage, longDelayMs);

  // Ensure delayer removed both message from the queue.
  ackStub.should.have.been.calledTwice;

  // Expecting this to return short delay message.
  const readyMessages = await delayer.getReadyMessages();
  readyMessages.should.have.lengthOf(1);
  // TODO: ensure it's correct message

  // Ensure the message has been saved to redis.
  // Expect short and long messages to return.
  const redisMessagesAll = await redisClient.zrange(redis.settings.retrySet, 0, 10);
  redisMessagesAll.should.have.lengthOf(2);
  // TODO: ensure it's correct messages.

  // Restore stubbed functions.
  sandbox.restore();
});

// ------- End -----------------------------------------------------------------
