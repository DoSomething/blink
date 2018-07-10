'use strict';

const CustomerIoGambitBroadcastMessage = require('../messages/CustomerIoGambitBroadcastMessage');
const Queue = require('../lib/Queue');

class CustomerIoGambitBroadcastQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CustomerIoGambitBroadcastMessage;
  }
}

module.exports = CustomerIoGambitBroadcastQ;
