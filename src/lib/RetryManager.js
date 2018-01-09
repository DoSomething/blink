'use strict';

// ------- Imports -------------------------------------------------------------

const logger = require('winston');

// ------- Internal imports ----------------------------------------------------

const DelayLogic = require('./delayers/DelayLogic');
const InMemoryRetryDelayer = require('./delayers/InMemoryRetryDelayer');
const RetryDelayer = require('./delayers/RetryDelayer');

// ------- Class ---------------------------------------------------------------

class RetryManager {
  constructor(queue, retryDelayer = false, delayLogic = false) {
    this.queue = queue;

    // Retry delay mechanism.
    if (retryDelayer instanceof RetryDelayer) {
      this.retryDelayer = retryDelayer;
    } else {
      // Defaults to in-memory delayer.
      this.retryDelayer = new InMemoryRetryDelayer();
    }

    // Retry delay logic.
    if (typeof delayLogic === 'function') {
      this.delayLogic = delayLogic;
    } else {
      // Default exponential backoff logic
      this.delayLogic = DelayLogic.exponentialBackoff;
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
    const delayMs = this.delayLogic(message.getRetryAttempt());

    // Log retry information.
    this.log(
      'debug',
      `Retry scheduled, attempt ${message.getRetryAttempt()}, reason '${reason}', retry in ${delayMs}ms`,
      message,
      'debug_retry_manager_redeliver_scheduled',
    );

    return this.retryDelayer.delayMessageRetry(this.queue, message, delayMs);
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

// ------- Exports -------------------------------------------------------------

module.exports = RetryManager;

// ------- End -----------------------------------------------------------------
