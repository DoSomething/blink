'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');

const MessageValidationBlinkError = require('../../../src/errors/MessageValidationBlinkError');
const UserMessage = require('../../../src/messages/UserMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');
const MessageValidationHelper = require('../../helpers/MessageValidationHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const chance = new Chance();
const generator = MessageFactoryHelper.getValidUser;
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
    generator().validateStrict.should.not.throw(MessageValidationBlinkError);
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

test('User Message should remove certain optional fields when empty', () => {
  [
    'email',
    'mobile',
  ]
    .forEach(field => MessageValidationHelper.removesWhenEmpty(field, generator, mutator));
});

test('User Message optional fields should have correct default values', () => {
  const mapping = {
    last_authenticated_at: null,
    birthdate: null,
    facebook_id: null,
    first_name: null,
    last_name: null,
    addr_city: null,
    addr_state: null,
    addr_zip: null,
    source: null,
    source_detail: null,
    language: null,
    country: null,
    role: 'user',
    interests: null,
    sms_status: null,
  };
  Object.entries(mapping).forEach(([field, defaultValue]) => {
    MessageValidationHelper.defaultsToWhenEmpty(field, defaultValue, generator, mutator);
  });
});

test('User Message should fail on incorrect types', () => {
  const mapping = {
    id: chance.integer(),
    email: chance.integer(),
    mobile: chance.integer(),
    updated_at: chance.integer(),
    created_at: chance.integer(),
    // no sms_status
    last_authenticated_at: chance.integer(),
    birthdate: chance.integer(),
    facebook_id: chance.integer(),
    first_name: chance.integer(),
    last_name: chance.integer(),
    addr_city: chance.integer(),
    addr_state: chance.integer(),
    addr_zip: chance.integer(),
    source: chance.integer(),
    source_detail: chance.integer(),
    language: chance.integer(),
    country: chance.integer(),
    role: chance.integer(),
    interests: chance.word(),
  };
  Object.entries(mapping).forEach(([field, incorrectValue]) => {
    MessageValidationHelper.ensureType(field, incorrectValue, generator, mutator);
  });
});

test('Test mobile only users', () => {
  let mutant;

  // Test normal user.
  generator().isMobileOnly().should.be.false;

  // Test no email
  mutant = mutator({
    remove: 'email',
    message: generator(),
  });
  mutant.isMobileOnly().should.be.true;

  // Test no email
  mutant = mutator({
    change: 'email',
    value: '',
    message: generator(),
  });
  mutant.isMobileOnly().should.be.true;

  // Test 15554443332@mobile.import
  mutant = mutator({
    change: 'email',
    value: '15554443332@mobile.import',
    message: generator(),
  });
  mutant.isMobileOnly().should.be.true;

  // Test runscope source
  mutant = mutator({
    change: 'source',
    value: 'runscope',
    message: generator(),
  });
  mutant.isMobileOnly().should.be.true;
});

// ------- End -----------------------------------------------------------------
