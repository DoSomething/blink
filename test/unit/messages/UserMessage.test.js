'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const MessageValidationBlinkError = require('../../../src/errors/MessageValidationBlinkError');
const UserMessage = require('../../../src/messages/UserMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');
const MessageValidationHelper = require('../../helpers/MessageValidationHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const generator = MessageFactoryHelper.getUserMessage;
const mutator = function ({ remove, change, value, message }) {
  const mutant = message;
  if (remove) {
    delete mutant.payload.data[remove];
    return mutant;
  }
  if (change) {
    mutant.payload.data[change] = value;
    return mutant;
  }
  return false;
};

// ------- Tests ---------------------------------------------------------------

test('User message generator', () => {
  generator().should.be.an.instanceof(UserMessage);
});

test('Validate a hundred fake users', () => {
  let count = 100;
  while (count > 0) {
    generator().validate.should.not.throw(MessageValidationBlinkError);
    count -= 1;
  }
});

test('User Message should fail if required fields are missing, undefined, null, or empty', () => {
  [
    'id',
    'created_at',
    'updated_at',
  ]
    .forEach(field => MessageValidationHelper.failsWithout(field, generator, mutator));
});

// ------- End -----------------------------------------------------------------
