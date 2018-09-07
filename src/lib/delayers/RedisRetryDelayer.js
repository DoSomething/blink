'use strict';

// ------- Lint exceptions -----------------------------------------------------

// We want this method to inherit from the interface.
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["delayMessageRetry"] }] */

// ------- Imports -------------------------------------------------------------

const logger = require('../../../config/logger');
const moment = require('moment');

// ------- Internal imports ----------------------------------------------------

const RetryDelayer = require('./RetryDelayer');

// ------- Class ---------------------------------------------------------------

class RedisRetryDelayer extends RetryDelayer {
  constructor(redisClient, { retrySet, retrySetProcessLimit }) {
    super();
    this.redisClient = redisClient;
    this.retrySet = retrySet;
    this.retrySetProcessLimit = retrySetProcessLimit;
  }

  /**
   * Sends `message` to Redis Sorted Set, ordered by the return time,
   * which is calculated from UNIX timestamp + `delayMs`.
   * When time has come, special Redis Retry Redelivery Worker
   * will republish it back to the `queue`.
   *
   * @see https://redis.io/topics/data-types#sorted-sets
   * @see https://redis.io/commands/zadd
   *
   * @param  {Queue}   queue          The queue to return the message to
   * @param  {Message} message        The message
   * @param  {integer} delayMs        The delay, milliseconds
   * @return {boolean}                The result of the operation
   */
  async delayMessageRetry(queue, message, delayMs) {
    // Calculate return (redelivery) time.
    // This will serve as the index for the ordered set.
    const republishTime = RedisRetryDelayer.calculateRepublishTime(delayMs);
    // Save queue name to redeliver message to and convert message to String.
    const packedMessage = RedisRetryDelayer.packMessage(message, queue);
    // Publish message to Redis.
    const result = await this.saveMessageToRedis(packedMessage, republishTime);
    if (!result) {
      return false;
    }

    // Free original message from the broker.
    queue.ack(message);
    return true;
  }

  async saveMessageToRedis(packedMessage, republishTime) {
    let result;
    try {
      result = await this.redisClient.zadd(
        this.retrySet,
        republishTime,
        packedMessage,
      );
    } catch (error) {
      logger.error(`Redis zadd error: ${error}.`, {
        meta: {
          code: 'error_redis_retry_delayer_zadd',
        },
      });
      return false;
    }

    // Check if this record already present in Redis.
    // This usually shouldn't happen, but the operation still can be
    // considered successful. Just watch out for this situations.
    if (result !== 1) {
      logger.debug(`Redis message already present: ${packedMessage}.`, {
        meta: {
          code: 'sucess_redis_retry_delayer_message_saved',
        },
      });
    }

    logger.debug(`Redis message saved: ${packedMessage}.`, {
      meta: {
        code: 'sucess_redis_retry_delayer_message_saved',
      },
    });
    return true;
  }

  async getReadyMessages() {
    const currentTime = moment().unix();
    const packedMessages = await this.redisClient.zrangebyscore(
      this.retrySet,
      0, // from 0
      currentTime, // to date
      ['LIMIT', 0, this.retrySetProcessLimit],
    );
    return packedMessages;
  }

  async removeProcessedMessage(packedMessage) {
    return this.redisClient.zrem(this.retrySet, packedMessage);
  }

  static calculateRepublishTime(delayMs) {
    const republishTime = moment();
    republishTime.add(delayMs, 'milliseconds');
    return republishTime.unix();
  }

  static packMessage(message, queue) {
    message.setRetryReturnToQueue(queue.name);
    return message.toString();
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = RedisRetryDelayer;

// ------- End -----------------------------------------------------------------
