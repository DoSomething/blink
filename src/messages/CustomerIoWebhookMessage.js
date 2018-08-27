'use strict';

const Joi = require('joi');

const Message = require('./Message');
const config = require('../../config/messages/CustomerIoWebhookMessage');

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

  getEventType() {
    return this.getData().event_type;
  }

  getEventRoutingKey(eventType = this.getEventType()) {
    const eventConfig = config.events[eventType] || config.events.generic;
    return eventConfig.routingKey;
  }
}

module.exports = CustomerIoWebhookMessage;
