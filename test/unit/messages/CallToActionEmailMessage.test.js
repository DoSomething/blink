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

test('Call to action email message generator', () => {
  generator().should.be.an.instanceof(CallToActionEmailMessage);
});

test('Call to action email message should have toCustomerIoEvent', () => {
  generator().should.respondsTo('toCustomerIoEvent');
});

test('Call to action email message should be correctly transformed to CustomerIoEvent', () => {
  let count = 100;
  while (count > 0) {
    const msg = generator();
    const data = msg.getData();
    const cioEvent = msg.toCustomerIoEvent();

    expect(cioEvent).to.be.an.instanceof(CustomerIoEvent);

    cioEvent.getId().should.equal(data.userId);
    cioEvent.getName().should.equal('call_to_action_email');

    const eventData = cioEvent.getData();
    eventData.version.should.equal(3);

    cioEvent.getId().should.equal(data.userId);
    eventData.actionText.should.equal(data.actionText);
    eventData.actionUrl.should.equal(data.actionUrl);
    eventData.intro.should.equal(data.intro);
    eventData.outro.should.equal(data.outro);
    eventData.subject.should.equal(data.subject);
    eventData.type.should.equal(data.type);

    count -= 1;
  }
});

// ------- End -----------------------------------------------------------------
