'use strict';

const TwilioOutboundStatusCallbackMessage = require('../messages/TwilioOutboundStatusCallbackMessage');
const Queue = require('../lib/Queue');

class TwilioSmsOutboundStatusRelayQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = TwilioOutboundStatusCallbackMessage;
    this.routes.push('sms-outbound-status.twilio.webhook');
  }
}

module.exports = TwilioSmsOutboundStatusRelayQ;
