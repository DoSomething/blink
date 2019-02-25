'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const PasswordResetMessage = require('../../../src/messages/PasswordResetMessage');
const CustomerIoEvent = require('../../../src/models/CustomerIoEvent');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const expect = chai.expect;
const generator = MessageFactoryHelper.getPasswordResetMessage;

// ------- Tests ---------------------------------------------------------------

test('Password reset message generator', () => {
  generator().should.be.an.instanceof(PasswordResetMessage);
});

test('Password reset message should have toCustomerIoEvent', () => {
  generator().should.respondsTo('toCustomerIoEvent');
});

test('Password reset message should be correctly transformed to CustomerIoEvent', () => {
  let count = 100;
  while (count > 0) {
    const msg = generator();
    const data = msg.getData();
    const cioEvent = msg.toCustomerIoEvent();

    expect(cioEvent).to.be.an.instanceof(CustomerIoEvent);

    cioEvent.getId().should.equal(data.user_id);
    cioEvent.getName().should.equal('password_reset');

    const eventData = cioEvent.getData();
    eventData.version.should.equal(3);

    eventData.body.should.equal(data.body);
    eventData.subject.should.equal(data.subject);
    eventData.type.should.equal(data.type);
    eventData.url.should.equal(data.url);

    count -= 1;
  }
});

// ------- End -----------------------------------------------------------------
