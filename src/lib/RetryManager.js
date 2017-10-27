'use strict';

const logger = require('winston');

const DelayLogic = require('./DelayLogic');

class RetryManager {
  constructor(queue, republishDelayLogic = false) {
    this.queue = queue;

    // Retry delay logic.
    if (!republishDelayLogic || typeof republishDelayLogic !== 'function') {
      // Default exponential backoff logic
      this.retryAttemptToDelayTime = DelayLogic.exponentialBackoff;
    } else {
      this.retryAttemptToDelayTime = republishDelayLogic;
    }

    // Retry limit is a hardcoded const now.
    this.retryLimit = 100;
  }

  async retry(message, error) {
    // Get text description from Error object.
    const reason = error.message;

    // Ensure message is allowed for a retry, otherwise discard it.
    if (!this.retryAllowed(message, reason)) {
      this.queue.nack(message);
      return false;
    }

    // Update retry attempt count and save the reason.
    message.incrementRetryAttempt(reason);

    // Calculate wait time until the redelivery.
    const delayMs = this.retryAttemptToDelayTime(message.getRetryAttempt());

    // Log retry information.
    this.log(
      'debug',
      `Retry scheduled, attempt ${message.getRetryAttempt()}, reason '${reason}', retry in ${delayMs}ms`,
      message,
      'debug_retry_manager_redeliver_scheduled',
    );

    return this.republishWithDelay(message, delayMs);
  }

  async republishWithDelay(message, delayMs) {
    // Delay republish using timeout.
    // Note: this conflicts with prefetch_count functionality, see issue #70.
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Discard original message.
    this.queue.nack(message);
    // Republish modified message.
    this.queue.publish(message);
    return true;
  }

  retryAllowed(message, reason) {
    if (message.getRetryAttempt() >= this.retryLimit) {
      // Retry limit reached.
      // Log the reason why message is denied for retry.
      this.log(
        'debug',
        `Retry limit reached, rejecting. Retry reason '${reason}'`,
        message,
        'debug_retry_manager_limit_reached',
      );
      return false;
    }
    return true;
  }

  log(level, logMessage, message = {}, code = 'unexpected_code') {
    const meta = {
      // Todo: log env
      code,
      queue: this.queue.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
    };

    logger.log(level, logMessage, meta);
  }
}

module.exports = RetryManager;
