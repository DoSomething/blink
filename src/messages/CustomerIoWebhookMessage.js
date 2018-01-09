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
}

module.exports = CustomerIoWebhookMessage;
