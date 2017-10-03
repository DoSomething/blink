'use strict';

const Joi = require('joi');

const Message = require('./Message');
const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');

class UserMessage extends Message {
  constructor(...args) {
    super(...args);

    // Data validation rules.
    // TODO: move to helpers.
    const whenNullOrEmpty = Joi.valid(['', null]);
    const optionalStringDefaultsToNull = Joi.string().empty(whenNullOrEmpty).default(null);
    const optionalDateDefaultsToNull = Joi.string().isoDate().empty(whenNullOrEmpty).default(null);

    this.schema = Joi.object().keys({
      id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),

      // Remove field when provided as empty string or null.
      email: Joi.string().empty(whenNullOrEmpty).default(undefined),
      mobile: Joi.string().empty(whenNullOrEmpty).default(undefined),

      // Required:
      updated_at: Joi.string().empty(whenNullOrEmpty).required().isoDate(),
      created_at: Joi.string().empty(whenNullOrEmpty).required().isoDate(),
      sms_status: Joi.valid([
        'active',
        'less',
        'undeliverable',
        'unknown',
        null,
      ]).default(null),

      // Optional, defaults to null when provided as empty string or null.
      last_authenticated_at: optionalDateDefaultsToNull,
      birthdate: Joi.string()
        .empty(whenNullOrEmpty)
        .regex(/^(\d{4})-(\d{2})-(\d{2})$/, 'valid birthdate')
        .default(null),
      facebook_id: optionalStringDefaultsToNull,
      first_name: optionalStringDefaultsToNull,
      last_name: optionalStringDefaultsToNull,
      addr_city: optionalStringDefaultsToNull,
      addr_state: optionalStringDefaultsToNull,
      addr_zip: optionalStringDefaultsToNull,
      source: optionalStringDefaultsToNull,
      source_detail: optionalStringDefaultsToNull,
      language: optionalStringDefaultsToNull,
      country: optionalStringDefaultsToNull,

      // Allow anything as a role, but default to user.
      role: Joi.string().empty(whenNullOrEmpty).default('user'),

      // When interests not present, make them an empty array.
      interests: Joi.array().items(Joi.string()).empty(null).default(null),
    })
    // Require presence at least one of: email, mobile.
      .or('email', 'mobile');
  }

  isMobileOnly() {
    const userData = this.getData();
    if (!userData.email) {
      return true;
    }
    if (userData.email === '') {
      return true;
    }
    if (userData.email.match(/@.*\.import$/)) {
      return true;
    }
    if (userData.source === 'runscope') {
      return true;
    }
    return false;
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const userMessage = new UserMessage({
      data: ctx.request.body,
      meta: {
        request_id: ctx.id,
      },
    });
    return userMessage;
  }

  static fromRabbitMessage(rabbitMessage) {
    const payload = this.parseIncomingPayload(rabbitMessage);
    if (!payload.data || !payload.meta) {
      throw new MessageParsingBlinkError('No data in message', payload);
    }

    // TODO: save more metadata
    // TODO: metadata parse helper
    const userMessage = new UserMessage({
      data: payload.data,
      meta: payload.meta,
    });
    userMessage.fields = rabbitMessage.fields;
    return userMessage;
  }
}

module.exports = UserMessage;
