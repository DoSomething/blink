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
      // Sent to us as Unix timestamp (seconds)
      timestamp: Joi.number().integer().required(),
    });
  }

  // @see https://customer.io/docs/developer-documentation/webhooks.html#list-of-webhook-attributes
  getUserId() {
    return this.getData().data.customer_id;
  }

  getEventTimestamp() {
    return this.getData().timestamp;
  }

  // TODO: return Date object per https://github.com/DoSomething/blink/pull/247#discussion_r423854150
  // when date-fns is updated to latest version that supports https://date-fns.org/v2.13.0/docs/fromUnixTime
  getEventTimestampInMilliseconds() {
    return this.getData().timestamp * 1000;
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
