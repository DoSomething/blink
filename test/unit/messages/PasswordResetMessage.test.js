'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const CallToActionEmailMessage = require('../../../src/messages/CallToActionEmailMessage');
const CustomerIoEvent = require('../../../src/models/CustomerIoEvent');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const expect = chai.expect;
const generator = MessageFactoryHelper.getCallToActionEmailMessage;

// ------- Tests ---------------------------------------------------------------

test('Password reset message generator', () => {
  generator().should.be.an.instanceof(CallToActionEmailMessage);
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
    cioEvent.getName().should.equal('call_to_action_email');

    const eventData = cioEvent.getData();
    eventData.version.should.equal(3);

    cioEvent.getId().should.equal(data.user_id);
    eventData.body.should.equal(data.body);
    eventData.subject.should.equal(data.subject);
    eventData.type.should.equal(data.type);
    eventData.url.should.equal(data.url);

    count -= 1;
  }
});

// ------- End -----------------------------------------------------------------
