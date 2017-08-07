'use strict';

const Joi = require('joi');

const Message = require('./Message');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');

class MdataMessage extends Message {
  constructor(...args) {
    super(...args);

    this.schema = Joi.object()
      // Validate presence of minimal expected keys.
      .keys({
        phone: Joi.string().required(),
        profile_id: Joi.string().required(),
        message_id: Joi.string().required(),

        // Treat the following as not present when provided as empty string.
        keyword: Joi.string().empty(''),
        args: Joi.string().empty(''),
        mms_image_url: Joi.string().empty(''),
      })
      // Require presence at least one of: keyword, args, mms_image_url.
      .or('keyword', 'args', 'mms_image_url')
      // Allow presence of all other keys.
      .unknown();
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const mdataMessage = new MdataMessage({
      data: ctx.request.body,
      meta: {
        request_id: ctx.id,
      },
    });
    return mdataMessage;
  }

  static fromRabbitMessage(rabbitMessage) {
    const payload = this.parseIncomingPayload(rabbitMessage);
    if (!payload.data || !payload.meta) {
      throw new MessageParsingBlinkError('No data in message', payload);
    }

    // TODO: save more metadata
    // TODO: metadata parse helper
    const mdataMessage = new MdataMessage({
      data: payload.data,
      meta: payload.meta,
    });
    mdataMessage.fields = rabbitMessage.fields;
    return mdataMessage;
  }
}

module.exports = MdataMessage;
