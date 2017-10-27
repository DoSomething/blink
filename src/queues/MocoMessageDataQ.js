'use strict';

const TwilioStatusCallbackMessage = require('../messages/TwilioStatusCallbackMessage');
const Queue = require('../lib/Queue');

class MocoMessageDataQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = TwilioStatusCallbackMessage;
  }
}

module.exports = MocoMessageDataQ;
