'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const moment = require('moment');

const CustomerIoUpdateCustomerMessage = require('../../../src/messages/CustomerIoUpdateCustomerMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');


// ------- Init ----------------------------------------------------------------

chai.should();
const generator = MessageFactoryHelper.getValidCustomerIoIdentify;

// ------- Tests ---------------------------------------------------------------

test('User message generator', () => {
  generator().should.be.an.instanceof(CustomerIoUpdateCustomerMessage);
});

test('Cio identify created from Northstar is correct', () => {
  let count = 100;
  while (count > 0) {
    const userMessage = MessageFactoryHelper.getValidUser();
    userMessage.validate();
    const userData = userMessage.getData();
    const customerIoUpdateCustomerMessage = CustomerIoUpdateCustomerMessage.fromUser(
      userMessage,
    );

    const cioUpdateData = customerIoUpdateCustomerMessage.getData();

    // Compare properties.

    // Required:
    cioUpdateData.should.have.property('id', userData.id);
    cioUpdateData.should.have.property('data').and.to.be.an('object');
    cioUpdateData.data.should.have.property('email', userData.email);
    cioUpdateData.data.should.have.property('phone', userData.mobile);

    const cioUpdateAttributes = cioUpdateData.data;
    cioUpdateAttributes.should.have.property(
      'updated_at',
      moment(userData.updated_at).unix(),
    );
    cioUpdateAttributes.should.have.property(
      'created_at',
      moment(userData.created_at).unix(),
    );
    count -= 1;
  }
});

// ------- End -----------------------------------------------------------------
