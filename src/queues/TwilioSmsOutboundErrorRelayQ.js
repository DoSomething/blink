'use strict';

const TwilioOutboundStatusCallbackMessage = require('../messages/TwilioOutboundStatusCallbackMessage');
const Queue = require('../lib/Queue');

class TwilioSmsOutboundErrorRelayQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = TwilioOutboundStatusCallbackMessage;
    this.routes.push('sms-outbound-error.twilio.webhook');
  }
}

module.exports = TwilioSmsOutboundErrorRelayQ;
