'use strict';

const FreeFormMessage = require('../messages/FreeFormMessage');
const Queue = require('../lib/Queue');

class TwilioSmsInboundGambitRelayQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = FreeFormMessage;
    this.routes.push('sms-inbound.twilio.webhook');
  }
}

module.exports = TwilioSmsInboundGambitRelayQ;
