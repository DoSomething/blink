'use strict';

const BlinkError = require('./BlinkError');

class ForbiddenBlinkError extends BlinkError {
  constructor(errorMessage) {
    super(errorMessage);
    this.status = 403;
  }
}

module.exports = ForbiddenBlinkError;
