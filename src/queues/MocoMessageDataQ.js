'use strict';

const TwillioStatusCallbackMessage = require('../messages/TwillioStatusCallbackMessage');
const Queue = require('./Queue');

class MocoMessageDataQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = TwillioStatusCallbackMessage;
  }
}

module.exports = MocoMessageDataQ;
