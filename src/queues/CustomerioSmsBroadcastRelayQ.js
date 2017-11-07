'use strict';

const CustomerioSmsBroadcastMessage = require('../messages/CustomerioSmsBroadcastMessage');
const Queue = require('../lib/Queue');

class CustomerioSmsBroadcastRelayQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CustomerioSmsBroadcastMessage;
  }
}

module.exports = CustomerioSmsBroadcastRelayQ;
