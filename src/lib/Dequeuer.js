'use strict';

const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');

class Dequeuer {
  constructor(queue, callback, retryManager) {
    this.queue = queue;
    this.callback = callback;

    // Expose function by binding it to object context.
    this.dequeue = this.dequeue.bind(this);

    // Inject retry manager.
    this.retryManager = retryManager;
  }

  async dequeue(rabbitMessage) {
    const message = this.extractOrDiscard(rabbitMessage);
    if (message) {
      await this.executeCallback(message);
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
      `Message valid ${message.toString()}`,
      message,
      'success_dequeue_message_valid',
    );
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

module.exports = Dequeuer;
