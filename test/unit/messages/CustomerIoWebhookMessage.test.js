'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const CustomerIoWebhookMessage = require('../../../src/messages/CustomerIoWebhookMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');
const customerIoWebhookConfig = require('../../../config/messages/CustomerIoWebhookMessage');

// ------- Init ----------------------------------------------------------------

chai.should();
const generator = MessageFactoryHelper.getCustomerIoWebhookMessage;

// ------- Tests ---------------------------------------------------------------

test('C.io webhook message generator', () => {
  generator().should.be.an.instanceof(CustomerIoWebhookMessage);
});

test('C.io webhook message should respond to getUserId, getEventType, and getEventRoutingKey', () => {
  const msg = generator();
  msg.should.respondsTo('getUserId');
  msg.should.respondsTo('getEventType');
  msg.should.respondsTo('getEventRoutingKey');
});

test('An email_unsubscribed event message should get the email_unsubscribed routing key when calling getEventRoutingKey()', () => {
  const emailUnsubscribedRoutingKey = customerIoWebhookConfig.events.email_unsubscribed.routingKey;
  const msg = MessageFactoryHelper.getCustomerIoWebhookMessage('email_unsubscribed');
  const routingKey = msg.getEventRoutingKey();
  routingKey.should.be.equal(emailUnsubscribedRoutingKey);
});

test('Any non specialized event message should get the generic routing key when calling getEventRoutingKey()', () => {
  const genericRoutingKey = customerIoWebhookConfig.events.generic.routingKey;
  const msg = MessageFactoryHelper.getCustomerIoWebhookMessage();
  const routingKey = msg.getEventRoutingKey();
  routingKey.should.be.equal(genericRoutingKey);
});

test('C.io webhook message should return the data.customer_id propety when calling getUserId()', () => {
  const msg = MessageFactoryHelper.getCustomerIoWebhookMessage();
  const userId = msg.getUserId();
  userId.should.be.equal(msg.payload.data.data.customer_id);
});

// ------- End -----------------------------------------------------------------
