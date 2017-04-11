'use strict';

const changeCase = require('change-case');

const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');

class Queue {
  constructor(exchange, logger = false) {
    this.exchange = exchange;

    // Transforms Queue class name:
    // - Removes conventional Q at the end
    // - Parametrizes string
    // For example, RemoteHttpRequestQ will become remote-http-request.
    this.name = changeCase.paramCase(this.constructor.name.replace(/Q$/, ''));

    // Define route keys.
    this.routes = [];
    // Automagically create direct route to the queue using its name.
    this.routes.push(this.name);

    // TODO: think of better method of exposing Logger.
    if (logger) {
      this.logger = logger;
    }

    // Bind process method to queue context
    this.consumeIncomingMessage = this.consumeIncomingMessage.bind(this);
  }

  async setup() {
    return this.exchange.assertQueue(this);
  }

  /**
   * Send a single message to the queue bypassing routing.
   */
  publish(payload) {
    return this.exchange.publishDirect(this, payload);
  }

  /**
   * Purge the queue.
   *
   * @return {Number} The number of messages purged from the queue
   */
  async purge() {
    let result;
    try {
      result = await this.exchange.channel.purgeQueue(this.name);
    } catch (error) {
      // Wrap HTTP exceptions in meaningful response.
      throw new Error(`Queue.purge(): failed to purge queue "${this.name}": ${error.message}`);
    }
    return result.messageCount;
  }

  startConsuming() {
    // TODO: generate consumer tag
    this.logger.info(`Listening for messages in "${this.name}" queue`);
    this.exchange.channel.consume(this.name, this.consumeIncomingMessage);
  }

  nack(message) {
    this.exchange.channel.reject(message, false);
  }

  ack(message) {
    this.exchange.channel.ack(message);
  }

  async consumeIncomingMessage(incomingMessage) {
    try {
      // Will throw MessageValidationBlinkError when not valid.
      const validMessage = this.validateIncomingMessage(incomingMessage);
      // TODO: print message metadata
      this.logger.info(`Message valid | ${validMessage.payload.meta.id}`);
      const processResult = await this.process(validMessage);
      if (processResult) {
        this.logger.info(`Message processed | ${validMessage.payload.meta.id}`);
      } else {
        this.logger.info(`Message not processed | ${validMessage.payload.meta.id}`);
      }
    } catch (error) {
      if (error instanceof MessageParsingBlinkError) {
        this.logger.error(`Queue ${this.name}: can't parse payload, reason: "${error}", payload: "${error.rawPayload}"`);
      } else if (error instanceof MessageValidationBlinkError) {
        this.logger.error(`Queue ${this.name}: message validation error: "${error}", payload: "${error.payload}"`);
      } else {
        this.logger.error(`Queue ${this.name} uncaught exception ${error}`);
      }

      // TODO: send to dead letters?
      this.nack(incomingMessage);
    }
  }


}

module.exports = Queue;