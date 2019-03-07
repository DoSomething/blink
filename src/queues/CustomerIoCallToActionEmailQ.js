'use strict';

const CallToActionEmailMessage = require('../messages/CallToActionEmailMessage');
const Queue = require('../lib/Queue');

class CustomerIoCallToActionEmailQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CallToActionEmailMessage;
    this.routes.push('call-to-action-email.user.event');
  }
}

module.exports = CustomerIoCallToActionEmailQ;
