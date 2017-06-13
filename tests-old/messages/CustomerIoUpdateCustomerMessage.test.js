'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');
const moment = require('moment');

const MessageValidationBlinkError = require('../../src/errors/MessageValidationBlinkError');
const CustomerIoUpdateCustomerMessage = require('../../src/messages/CustomerIoUpdateCustomerMessage');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');
const MessageValidationHelper = require('../helpers/MessageValidationHelper');


// ------- Init ----------------------------------------------------------------

chai.should();
const expect = chai.expect;
const chance = new Chance();
const generator = MessageFactoryHelper.getValidCustomerIoIdentify;
const mutator = function ({ remove, change, value, message }) {
  const mutant = message;
  if (remove) {
    let ref;
    if (remove === 'id') {
      ref = mutant.payload.data;
    } else {
      ref = mutant.payload.data.data;
    }
    delete ref[remove];
    return mutant;
  }
  if (change) {
    let ref;
    if (change === 'id') {
      ref = mutant.payload.data;
    } else {
      ref = mutant.payload.data.data;
    }
    ref[change] = value;
    return mutant;
  }
  return false;
};

// ------- Tests ---------------------------------------------------------------

test('User message generator', () => {
  generator().should.be.an.instanceof(CustomerIoUpdateCustomerMessage);
});

test('Validate a hundred fake identify messages', () => {
  let count = 100;
  while (count > 0) {
    generator().validateStrict.should.not.throw(MessageValidationBlinkError);
    count -= 1;
  }
});

test('Cio identify should fail if required fields are missing, undefined, null, or empty', () => {
  [
    'id',
    'created_at',
    'updated_at',
  ]
  .forEach(field => MessageValidationHelper.failsWithout(field, generator, mutator));
});

test('Cio identify should remove certain optional fields when empty', () => {
  [
    'mobile_status',
    'last_authenticated_at',
    'birthdate',
    'first_name',
    'last_name',
    'addr_city',
    'addr_state',
    'addr_zip',
    'source',
    'source_detail',
    'language',
    'country',
    'unsubscribed',
    'subscribed_at',
  ]
  .forEach(field => MessageValidationHelper.removesWhenEmpty(field, generator, mutator));
});

test.skip('Cio identify optional fields should have correct default values', () => {
  const mapping = {
    role: 'user',
    unsubscried: true,
  };
  Object.entries(mapping).forEach(([field, defaultValue]) => {
    MessageValidationHelper.defaultsToWhenEmpty(field, defaultValue, generator, mutator);
  });
});

test('Cio identify should fail on incorrect types', () => {
  const mapping = {
    id: chance.integer(),
    email: chance.integer(),
    updated_at: chance.date().toISOString(),
    created_at: chance.date().toISOString(),
    // no mobile_status
    last_authenticated_at: chance.date().toISOString(),
    birthdate: chance.timestamp(),
    first_name: chance.integer(),
    last_name: chance.integer(),
    addr_city: chance.integer(),
    addr_state: chance.integer(),
    addr_zip: chance.integer(),
    source: chance.integer(),
    source_detail: chance.integer(),
    language: chance.integer(),
    country: chance.integer(),
    unsubscribed: chance.word(),
    subscribed_at: chance.date().toISOString(),
    role: chance.integer(),
    interests: chance.word(),
  };
  Object.entries(mapping).forEach(([field, incorrectValue]) => {
    MessageValidationHelper.ensureType(field, incorrectValue, generator, mutator);
  });
});


test('Cio identify created from Northsar is correct', () => {
  let count = 100;
  while (count > 0) {
    const userMessage = MessageFactoryHelper.getValidUser();
    userMessage.validateStrict();
    const userData = userMessage.getData();
    const customerIoUpdateCustomerMessage = CustomerIoUpdateCustomerMessage.fromUser(
      userMessage,
      true
    );

    customerIoUpdateCustomerMessage.validateStrict.should.not.throw(MessageValidationBlinkError);
    const cioUpdateData = customerIoUpdateCustomerMessage.getData();

    // Compare properties.

    // Required:
    cioUpdateData.should.have.property('id', userData.id);
    cioUpdateData.should.have.property('data').and.to.be.an('object');
    cioUpdateData.data.should.have.property('email', userData.email);

    const cioUpdateAttributes = cioUpdateData.data;
    cioUpdateAttributes.should.have.property(
      'updated_at',
      moment(userData.updated_at).unix()
    );
    cioUpdateAttributes.should.have.property(
      'created_at',
      moment(userData.created_at).unix()
    );

    // Optional:
    if (cioUpdateAttributes.mobile_status) {
      expect(cioUpdateAttributes.mobile_status).to.be.equal(
        userData.mobile_status
      );
    }
    expect(cioUpdateAttributes.last_authenticated_at).to.be.equal(
      moment(userData.last_authenticated_at).unix()
    );
    expect(cioUpdateAttributes.first_name).to.be.equal(
      userData.first_name
    );
    expect(cioUpdateAttributes.last_name).to.be.equal(
      userData.last_name
    );
    expect(cioUpdateAttributes.addr_city).to.be.equal(
      userData.addr_city
    );
    expect(cioUpdateAttributes.addr_state).to.be.equal(
      userData.addr_state
    );
    expect(cioUpdateAttributes.addr_zip).to.be.equal(
      userData.addr_zip
    );
    expect(cioUpdateAttributes.source).to.be.equal(
      userData.source
    );
    expect(cioUpdateAttributes.source_detail).to.be.equal(
      userData.source_detail
    );
    expect(cioUpdateAttributes.language).to.be.equal(
      userData.language
    );
    expect(cioUpdateAttributes.country).to.be.equal(
      userData.country
    );
    expect(cioUpdateAttributes.unsubscribed).to.be.equal(false);
    cioUpdateAttributes.should.have.property('subscribed_at');
    expect(cioUpdateAttributes.role).to.be.equal(
      userData.role
    );
    expect(cioUpdateAttributes.interests).to.deep.equal(
      userData.interests
    );
    count -= 1;
  }
});

// ------- End -----------------------------------------------------------------
