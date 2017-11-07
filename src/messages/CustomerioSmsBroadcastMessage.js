'use strict';

const Joi = require('joi');

const Message = require('./Message');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');

class CustomerioSmsBroadcastMessage extends Message {
  constructor(...args) {
    super(...args);

    const whenNullOrEmpty = Joi.valid(['', null]);
    const statusRegex = /broadcastId=.+$/;
    this.schema = Joi.object()
      .keys({
        // Note: first char of To is plus, which is resolved to a space by mistake.
        To: Joi.string().required().empty(whenNullOrEmpty).regex(/^ 1[0-9]+$/, 'valid phone number'),
        Body: Joi.string().required().empty(whenNullOrEmpty),
        MessagingServiceSid: Joi.string().required().empty(whenNullOrEmpty),
        StatusCallback: Joi.string().required().empty(whenNullOrEmpty).regex(statusRegex, 'valid status callback'),
      });
  }

  getBody() {
    return this.getData().Body;
  }

  getPhoneNumber() {
    return this.getData().To.replace(/^ /, '+');
  }

  getBroadcastId() {
    return this.getData().StatusCallback.match(/broadcastId=(.+)/)[1];
  }

  getMessageSid() {
    return this.getMeta().messageSid;
  }

  setMessageSid(messageSid) {
    this.getMeta().messageSid = messageSid;
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const meta = {
      request_id: ctx.id,
    };
    const message = new CustomerioSmsBroadcastMessage({
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
    const message = new CustomerioSmsBroadcastMessage({
      data: payload.data,
      meta: payload.meta,
    });
    message.fields = rabbitMessage.fields;
    return message;
  }
}

module.exports = CustomerioSmsBroadcastMessage;
