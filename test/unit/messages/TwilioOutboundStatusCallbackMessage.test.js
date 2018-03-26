'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const moment = require('moment');

const TwilioOutboundStatusCallbackMessage = require('../../../src/messages/TwilioOutboundStatusCallbackMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

const should = chai.should();
const generator = MessageFactoryHelper.getValidTwilioOutboundStatusData;

// ------- Tests ---------------------------------------------------------------

test('Twilio outbound status callback message generator', () => {
  generator().should.be.an.instanceof(TwilioOutboundStatusCallbackMessage);
});

test('Twilio outbound status callback message should respond to isError, isDelivered, setDeliveredAt, and setFailedAt', () => {
  const msg = generator();
  msg.should.respondsTo('isError');
  msg.should.respondsTo('isDelivered');
  msg.should.respondsTo('setDeliveredAt');
  msg.should.respondsTo('setFailedAt');
});

test('Twilio outbound status callback message should set deliveredAt', () => {
  const msg = generator();
  should.not.exist(msg.getData().deliveredAt);

  msg.setDeliveredAt(moment().format());
  should.exist(msg.getData().deliveredAt);
});

test('Twilio outbound status callback message should set failedAt', () => {
  const msg = MessageFactoryHelper.getValidTwilioOutboundErrorStatusData();
  should.not.exist(msg.getData().failedAt);

  msg.setFailedAt(moment().format());
  should.exist(msg.getData().failedAt);
});

// ------- End -----------------------------------------------------------------
