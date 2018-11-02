'use strict';

const MessageValidationBlinkError = require('../../src/errors/MessageValidationBlinkError');

class MessageValidationHelper {
  static failsWithout(fieldName, generator, mutator) {
    let mutant;
    mutant = mutator({
      remove: fieldName,
      message: generator(),
    });
    mutant.validate.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);

    mutant = mutator({
      change: fieldName,
      value: undefined,
      message: generator(),
    });
    mutant.validate.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);

    mutant = mutator({
      change: fieldName,
      value: null,
      message: generator(),
    });
    mutant.validate.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);

    mutant = mutator({
      change: fieldName,
      value: '',
      message: generator(),
    });
    mutant.validate.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);
  }
}

module.exports = MessageValidationHelper;
