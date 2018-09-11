'use strict';

const PromiseThrottle = require('promise-throttle');

const BlinkRetryError = require('../errors/BlinkRetryError');
const logger = require('../../config/logger');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');
const removePIITransformer = require('./helpers/logger/transformers/remove-pii');

class Dequeuer {
  constructor(queue, callback, retryManager, rateLimit = 100) {
    this.queue = queue;
    this.callback = callback;

    // Expose function by binding it to object context.
    this.dequeue = this.dequeue.bind(this);

    // Inject retry manager.
    this.retryManager = retryManager;

    // Hardcoded dequeue rate limit on all messages.
    // @todo: make configurable per worker.
    this.promiseThrottle = new PromiseThrottle({ requestsPerSecond: rateLimit });
  }

  async dequeue(rabbitMessage) {
    const message = this.extractOrDiscard(rabbitMessage);
    if (message) {
      // Throttle amount of messages processed per second.
      this.promiseThrottle.add(() => this.executeCallback(message));
    }
  }

  async executeCallback(message) {
    // Make sure nothing is thrown from here, it will kill the channel.
    let result;
    try {
      result = await this.callback(message);
    } catch (error) {
      return this.processCallbackError(message, error);
    }

    return this.processCallbackResult(message, result);
  }

  processCallbackResult(message, result) {
    // Acknowledge message and log result.
    this.queue.ack(message);
    if (result) {
      this.log(
        'debug',
        'Message acknowledged, processed true',
        message,
        'success_process_message_acknowledged_result_true',
      );
    } else {
      this.log(
        'debug',
        'Message acknowledged, processed false',
        message,
        'success_process_message_acknowledged_result_false',
      );
    }
    return true;
  }

  async processCallbackError(message, error) {
    // Got retry request.
    if (error instanceof BlinkRetryError) {
      return this.retryManager.retry(message, error);
    }

    // Really unexpected error, no retry requested.
    this.log(
      'error',
      error.toString(),
      message,
      'error_process_message_no_retry',
    );
    this.queue.nack(message);
    return false;
  }

  extractOrDiscard(rabbitMessage) {
    const message = this.unpack(rabbitMessage);
    if (!message || !this.validate(message)) {
      // Discard (nack) message when not extracted or not validated.
      this.queue.nack(rabbitMessage);
      return false;
    }
    return message;
  }

  unpack(rabbitMessage) {
    let message;

    // Transform raw to Message object.
    try {
      /**
       * TODO: store message type in message itself.
       * If a queue is declared without the messageClass instance property,
       * the worker will fail to parse this message w/ following error:
       * TypeError: Cannot read property 'fromRabbitMessage' of undefined
       */
      message = this.queue.messageClass.fromRabbitMessage(rabbitMessage);
    } catch (error) {
      if (error instanceof MessageParsingBlinkError) {
        this.log(
          'warning',
          `payload='${error.badPayload}' Can't parse payload: ${error}`,
          null,
          'warning_dequeue_cant_parse_message',
        );
      } else {
        this.log(
          'warning',
          `Unexpected message parsing error: ${error}`,
          null,
          'warning_dequeue_cant_parse_message_unexpected',
        );
      }
      return false;
    }
    return message;
  }

  validate(message) {
    // Validate payload.
    try {
      message.validate();
    } catch (error) {
      if (error instanceof MessageValidationBlinkError) {
        this.log(
          'warning',
          error.toString(),
          message,
          'warning_dequeue_message_validation',
        );
      } else {
        this.log(
          'warning',
          `Unexpected message validation error: ${error}`,
          null,
          'warning_dequeue_message_validation_unexpected',
        );
      }
      return false;
    }

    this.log(
      'debug',
      `Message valid ${message.toString(removePIITransformer)}`,
      message,
      'success_dequeue_message_valid',
    );
    return true;
  }

  /**
   * TODO: We should inject a logger in each class that needs it.
   * Implementing a log function per class is an anti-pattern that is making it hard to
   * propagate changes to all classes that log stuff. It also makes it hard to test.
   */
  log(level, logMessage, message = {}, code = 'unexpected_code') {
    const meta = {
      // Todo: log env
      code,
      queue: this.queue.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
    };

    logger.log(level, logMessage, { meta });
  }
}

module.exports = Dequeuer;
