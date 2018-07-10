'use strict';

const CustomerIoSmsStatusActiveMessage = require('../messages/CustomerIoSmsStatusActiveMessage');
const Queue = require('../lib/Queue');

class CustomerIoSmsStatusActiveQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CustomerIoSmsStatusActiveMessage;
    this.routes.push('sms-status-active.customer-io.webhook');
  }
}

module.exports = CustomerIoSmsStatusActiveQ;
