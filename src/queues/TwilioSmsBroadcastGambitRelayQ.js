'use strict';

const TwilioStatusCallbackMessage = require('../messages/TwilioStatusCallbackMessage');
const Queue = require('../lib/Queue');

class TwilioSmsBroadcastGambitRelayQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = TwilioStatusCallbackMessage;
    this.routes.push('sms-broadcast.status-callback.twilio.webhook');
  }
}

module.exports = TwilioSmsBroadcastGambitRelayQ;
