'use strict';

const Queue = require('../lib/Queue');

class QuasarCustomerIoEmailUnsubscribedQ extends Queue {
  constructor(...args) {
    super(...args);
    this.routes.push('email-unsubscribed.event.quasar');
  }
}

module.exports = QuasarCustomerIoEmailUnsubscribedQ;
