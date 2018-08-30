'use strict';

const Queue = require('../lib/Queue');

const CustomerIoWebhookMessage = require('../messages/CustomerIoWebhookMessage');

class QuasarCustomerIoEmailUnsubscribedQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CustomerIoWebhookMessage;
    this.routes.push('email-unsubscribed.event.quasar');
  }
}

module.exports = QuasarCustomerIoEmailUnsubscribedQ;
