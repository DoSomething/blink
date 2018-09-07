'use strict';

const Joi = require('joi');
const uuidV4 = require('uuid/v4');
const underscore = require('underscore');

const removePIITransformer = require('../lib/helpers/logger/transformers/remove-pii');
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

  toString(transformer = removePIITransformer) {
    let payload = this.payload;
    if (typeof transformer === 'function') {
      payload = transformer(payload);
    }
    return JSON.stringify(payload);
  }

  /**
   * validate - It validates the message's schema. If the minimum set of keys defined in the schema
   * is not met, the validation fails, throwing a MessageValidationBlinkError error. By default, it
   * allows all other non null keys to pass validation. In strict mode, it strips all
   * unknown keys -- Keys not defined explicitly in the validation schema itself.
   *
   * This method should be overridden in children classes if the default
   * doesn't fit the desired functionality. Example: FreeFormMessage
   *
   * @param  {type} strict = false - Use strict mode
   */
  validate(strict = false) {
    const options = {};
    let filtered;

    if (strict) {
      options.stripUnknown = true;
    } else {
      options.allowUnknown = true;
    }

    const { error, value: data } = Joi.validate(
      this.getData(),
      this.schema || {},
      options,
    );
    if (error) {
      throw new MessageValidationBlinkError(error.message, this.toString());
    }

    // If unknown keys are allowed, some might include null values, remove them
    if (!strict) {
      filtered = underscore.pick(data, value => !underscore.isNull(value));
    }

    this.payload.data = filtered || data;
    return true;
  }

  validateStrict() {
    return this.validate(true);
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
