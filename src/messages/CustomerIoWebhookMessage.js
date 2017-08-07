'use strict';

const Joi = require('joi');

const Message = require('./Message');

// TODO: url whitelist
// TODO: authentication
class CustomerIoWebhookMessage extends Message {
  constructor(...args) {
    super(...args);

    // Data validation rules.
    this.schema = Joi.object().keys({
      data: Joi.object().required(),
      event_id: Joi.string().required(),
      event_type: Joi.string().required(),
      timestamp: Joi.number().integer().required(),
    });
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const fetchMessage = new CustomerIoWebhookMessage({
      data: ctx.request.body,
      meta: {
        request_id: ctx.id,
      },
    });
    return fetchMessage;
  }
}

module.exports = CustomerIoWebhookMessage;
