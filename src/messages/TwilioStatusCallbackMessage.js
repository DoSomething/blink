'use strict';

const Joi = require('joi');

const Message = require('./Message');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');

class TwilioStatusCallbackMessage extends Message {
  constructor(...args) {
    super(...args);

    this.schema = Joi.object()
      // Allow presence of all other keys.
      .unknown();
  }

  isInbound() {
    return this.getData().SmsStatus === 'received';
  }

  isDelivered() {
    return this.getData().MessageStatus === 'delivered';
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper

    const meta = {
      request_id: ctx.id,
    };

    // Save GET params when present.
    // TODO: move to generic function for all messages?
    if (ctx.query && Object.keys(ctx.query).length) {
      meta.query = ctx.query;
    }

    const message = new TwilioStatusCallbackMessage({
      data: ctx.request.body,
      meta,
    });
    return message;
  }

  static fromRabbitMessage(rabbitMessage) {
    const payload = this.parseIncomingPayload(rabbitMessage);
    if (!payload.data || !payload.meta) {
      throw new MessageParsingBlinkError('No data in message', payload);
    }

    // TODO: save more metadata
    // TODO: metadata parse helper
    const message = new TwilioStatusCallbackMessage({
      data: payload.data,
      meta: payload.meta,
    });
    message.fields = rabbitMessage.fields;
    return message;
  }
}

module.exports = TwilioStatusCallbackMessage;
