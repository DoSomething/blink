'use strict';

const CustomerioGambitBroadcastMessage = require('../messages/CustomerioGambitBroadcastMessage');
const Queue = require('../lib/Queue');

class CustomerioGambitBroadcastQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CustomerioGambitBroadcastMessage;
  }
}

module.exports = CustomerioGambitBroadcastQ;
