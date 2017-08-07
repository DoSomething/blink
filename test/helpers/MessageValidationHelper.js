'use strict';

const MessageValidationBlinkError = require('../../src/errors/MessageValidationBlinkError');

class MessageValidationHelper {
  static failsWithout(fieldName, generator, mutator) {
    let mutant;
    mutant = mutator({
      remove: fieldName,
      message: generator(),
    });
    mutant.validateStrict.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);

    mutant = mutator({
      change: fieldName,
      value: undefined,
      message: generator(),
    });
    mutant.validateStrict.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);

    mutant = mutator({
      change: fieldName,
      value: null,
      message: generator(),
    });
    mutant.validateStrict.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);

    mutant = mutator({
      change: fieldName,
      value: '',
      message: generator(),
    });
    mutant.validateStrict.should.throw(MessageValidationBlinkError, `"${fieldName}" is required`);
  }

  static removesWhenEmpty(fieldName, generator, mutator) {
    let mutant;

    mutant = mutator({
      change: fieldName,
      value: '',
      message: generator(),
    });
    mutant.validateStrict();
    mutant.getData().should.not.have.property(fieldName);

    mutant = mutator({
      change: fieldName,
      value: null,
      message: generator(),
    });
    mutant.validateStrict();
    mutant.getData().should.not.have.property(fieldName);
  }

  static defaultsToWhenEmpty(fieldName, defaultValue, generator, mutator) {
    const mutant = mutator({
      remove: fieldName,
      message: generator(),
    });
    mutant.validateStrict();
    mutant.getData().should.have.property(fieldName).and.be.equal(defaultValue);
  }


  static ensureType(fieldName, incorrectValue, generator, mutator) {
    const mutant = mutator({
      change: fieldName,
      value: incorrectValue,
      message: generator(),
    });
    mutant.validateStrict.should.throw(MessageValidationBlinkError, `"${fieldName}" must be a`);
  }
}

module.exports = MessageValidationHelper;
