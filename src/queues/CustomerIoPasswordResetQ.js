'use strict';

const PasswordResetMessage = require('../messages/PasswordResetMessage');
const Queue = require('../lib/Queue');

class CustomerIoPasswordResetQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = PasswordResetMessage;
    this.routes.push('password-reset.user.event');
  }
}

module.exports = CustomerIoPasswordResetQ;
