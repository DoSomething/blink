'use strict';

const Joi = require('joi');
const uuidV4 = require('uuid/v4');

const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');

class Message {
  constructor({ data = {}, meta = {} }) {
    this.payload = { data, meta };
    // Generate unique message id or reuse request id.
    this.payload.meta.request_id = this.payload.meta.request_id || uuidV4();
    // Automatically set retryAttempt to 0.
    if (!this.payload.meta.retryAttempt || this.payload.meta.retryAttempt < 1) {
      this.payload.meta.retryAttempt = 0;
    }

    // Bind public functions.
    this.getData = this.getData.bind(this);
    this.getMeta = this.getMeta.bind(this);
    this.getRequestId = this.getRequestId.bind(this);
    this.toString = this.toString.bind(this);
    this.validate = this.validate.bind(this);
    this.validateStrict = this.validateStrict.bind(this);
  }

  getData() {
    return this.payload.data;
  }

  getMeta() {
    return this.payload.meta;
  }

  getRequestId() {
    return this.payload.meta.request_id;
  }

  getQueryParams() {
    return this.payload.meta.query;
  }

  getRetryAttempt() {
    return this.payload.meta.retryAttempt || 0;
  }

  setRetryReturnToQueue(queueName) {
    this.payload.meta.retryReturnToQueue = queueName;
  }

  unsetRetryReturnToQueue() {
    delete this.payload.meta.retryReturnToQueue;
  }

  incrementRetryAttempt(reason) {
    this.payload.meta.retryAttempt = this.getRetryAttempt() + 1;
    if (reason) {
      this.payload.meta.retryReason = reason;
    }
    return this.payload.meta.retryAttempt;
  }

  toString() {
    return JSON.stringify(this.payload);
  }

  validate() {
    const { error } = Joi.validate(this.getData(), this.schema || {});
    if (error) {
      throw new MessageValidationBlinkError(error.message, this.toString());
    }
    return true;
  }

  validateStrict() {
    const { error, value } = Joi.validate(
      this.getData(),
      this.schema || {},
      {
        stripUnknown: true,
      },
    );
    if (error) {
      throw new MessageValidationBlinkError(error.message, this.toString());
    }
    this.payload.data = value;
    return true;
  }

  static fromCtx(ctx) {
    const messageData = {
      data: ctx.request.body,
      meta: {
        // TODO: save more metadata/
        request_id: ctx.id,
      },
    };

    // Save GET params when present.
    // TODO: only save whitelsited query params?
    if (ctx.query && Object.keys(ctx.query).length) {
      messageData.meta.query = ctx.query;
    }

    return this.heuristicMessageFactory(messageData);
  }

  static fromRabbitMessage(rabbitMessage) {
    const payload = this.unpackRabbitMessage(rabbitMessage);
    if (!payload.data || !payload.meta) {
      throw new MessageParsingBlinkError('No data in message', payload);
    }

    const messageData = {
      data: payload.data,
      meta: payload.meta,
    };
    const message = this.heuristicMessageFactory(messageData);
    // Required to be compatible with RabbitMQ.
    // See RabbitMQBroker.ack() note.
    // TODO: make this method independent from RabbitMQ specifics..
    message.fields = rabbitMessage.fields;
    return message;
  }

  /**
   * Dynamically create a new instance of the concrete message class.
   *
   * This function automatically figures out on what of concrete message
   * subclasses one of static factory methods has been called and dynamically
   * creates a new instance of it.
   *
   * For example FreeFormMessage.heuristicMessageFactory({}) will return
   * an instance of FreeFormMessage. Despite the fact that actual
   * heuristicMessageFactory() method lives in its superclass, Message.
   *
   * This feature depends on the property of `this` context
   * inside of a static method to have `prototype` property
   * that is the class on which static method is called.
   * For example:
   *
   * ```
   * class Message {
   *   static printClassName() {
   *     console.log(this.prototype.constructor.name);
   *   }
   * }
   * class SpecificMessage extends Message {}
   * SpecificMessage.printClassName(); // prints 'SpecificMessage'
   * ```
   *
   * @param  {Object} messageData The message data, see constructor()
   * @return {this.prototype}  A new instance of the concrete message class.
   */
  static heuristicMessageFactory(messageData = {}) {
    return new this.prototype.constructor(messageData);
  }

  static unpackRabbitMessage(incomingMessage) {
    return Message.unpackJson(incomingMessage.content.toString());
  }

  static unpackJson(jsonMessage) {
    let payload;
    try {
      payload = JSON.parse(jsonMessage);
    } catch (error) {
      throw new MessageParsingBlinkError(error, jsonMessage);
    }
    return payload;
  }
}

module.exports = Message;
