'use strict';

const changeCase = require('change-case');
const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');

class Queue {
  constructor(exchange) {
    this.exchange = exchange;
    this.channel = exchange.channel;

    // Transforms Queue class name:
    // - Removes conventional Q at the end
    // - Parametrizes string
    // For example, RemoteHttpRequestQ will become remote-http-request.
    this.name = changeCase.paramCase(this.constructor.name.replace(/Q$/, ''));

    // Define route keys.
    this.routes = [];
    // Automagically create direct route to the queue using its name.
    this.routes.push(this.name);
  }

  async setup() {
    return this.exchange.setupQueue(this);
  }

  /**
   * Send a single message to the queue bypassing routing.
   */
  publish(message) {
    return this.exchange.publish(this.name, message);
  }

  nack(message) {
    this.channel.reject(message, false);
  }

  ack(message) {
    this.channel.ack(message);
  }

  retry(reason, message) {
    let retry = 0;
    if (message.getMeta().retry) {
      retry = message.getMeta().retry;
    }
    retry += 1;
    const retryMessage = message;
    retryMessage.payload.meta.retry = retry;
    retryMessage.payload.meta.retryReason = reason;
    // Republish modified message.
    this.nack(message);
    this.publish(retryMessage);
  }

  /**
   * Purge the queue.
   *
   * @return {Number} The number of messages purged from the queue
   */
  async purge() {
    let result;
    try {
      result = await this.channel.purgeQueue(this.name);
    } catch (error) {
      // Wrap HTTP exceptions in meaningful response.
      throw new Error(`Queue.purge(): failed to purge queue "${this.name}": ${error.message}`);
    }
    return result.messageCount;
  }

  subscribe(callback) {
    this.channel.consume(this.name, async (rabbitMessage) => {
      // Make sure nothing is thrown from here, it will kill the channel.
      const message = this.processRawMessage(rabbitMessage);
      if (!message) {
        return false;
      }

      let result;
      try {
        result = await callback(message);
      } catch (error) {
        if (error instanceof BlinkRetryError) {
          // Todo: move to setting
          const retryLimit = 100;
          const retry = message.getMeta().retry || 0;
          const retryDelay = Queue.retryDelay(retry);
          if (retry < retryLimit) {
            this.log(
              'warning',
              `Got error ${error}, retry ${retry}, retrying after ${retryDelay}ms`,
              message,
              'error_got_retry_request',
            );
            setTimeout(() => {
              this.retry(error.toString(), message);
            }, retryDelay);
          } else {
            this.log(
              'warning',
              `Got error ${error}, retry limit reached, rejecting`,
              message,
              'error_got_retry_limit_reached',
            );
            this.nack(message);
          }
          return false;
        }

        this.log(
          'warning',
          error.toString(),
          message,
          'message_processing_error',
        );
        // TODO: send to dead letters?
        this.nack(message);
        return false;
      }

      // TODO: Ack here depending on rejection exception? on result?
      this.ack(message);
      if (result) {
        this.log(
          'debug',
          'Message acknowledged, processed true',
          message,
          'acknowledged_true_result',
        );
      } else {
        this.log(
          'debug',
          'Message acknowledged, processed false',
          message,
          'success_message_ack_false_result',
        );
      }
      return true;
    });
  }

  processRawMessage(rabbitMessage) {
    let message;

    // Transform raw to Message object.
    try {
      message = this.messageClass.fromRabbitMessage(rabbitMessage);
    } catch (error) {
      if (error instanceof MessageParsingBlinkError) {
        this.log(
          'warning',
          `payload='${error.badPayload}' Can't parse payload: ${error}`,
          null,
          'error_cant_parse_message',
        );
      } else {
        this.log(
          'warning',
          `Unknown message parsing error: ${error}`,
          null,
          'error_cant_parse_message_unknown',
        );
      }
      this.nack(rabbitMessage);
      return false;
    }

    // Validate payload.
    try {
      message.validate();
    } catch (error) {
      if (error instanceof MessageValidationBlinkError) {
        this.log(
          'warning',
          error.toString(),
          message,
          'error_queue_message_validation',
        );
      } else {
        this.log(
          'warning',
          `Unexpected message validation error: ${error}`,
          null,
          'error_queue_unexpected_message_validation',
        );
      }
      this.nack(message);
      return false;
    }

    this.log(
      'debug',
      `Message valid ${message.toString()}`,
      message,
      'success_message_valid',
    );

    return message;
  }

  log(level, logMessage, message = {}, code = 'unexpected_code') {
    const meta = {
      // Todo: log env
      code,
      queue: this.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
    };

    logger.log(level, logMessage, meta);
  }

  static retryDelay(currentRetryNumber) {
    // Make longer delays as number of retries increases.
    // https://docs.google.com/spreadsheets/d/1AECd5YrOXJnYlH7BW9wtPBL2Tqp5Wjd3c0VnYGqA780/edit?usp=sharing
    // eslint-disable-next-line no-mixed-operators
    return ((currentRetryNumber ** 2) / 4 + 1) * 1000;
  }
}

module.exports = Queue;
