'use strict';

const BlinkError = require('./BlinkError');

class BlinkSendToDLXError extends BlinkError {
  constructor(errorMessage, blinkMessage) {
    super(errorMessage);
    this.blinkMessage = blinkMessage;
  }
}

module.exports = BlinkSendToDLXError;
