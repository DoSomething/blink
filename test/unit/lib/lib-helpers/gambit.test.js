'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const Promise = require('bluebird');
const moment = require('moment');

// ------- Internal imports ----------------------------------------------------

const gambitHelper = require('../../../../src/lib/helpers/gambit');
const messageFactoryHelper = require('../../../helpers/MessageFactoryHelper');
const BlinkRetryError = require('../../../../src/errors/BlinkRetryError');

// ------- Init ----------------------------------------------------------------

const should = chai.should();
const expect = chai.expect;
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

test.afterEach(() => {
  // reset stubs, spies, and mocks
  sandbox.restore();
});

// ------- Tests ---------------------------------------------------------------

/**
 * parseMessageIdFromBody
 */

test('parseMessageIdFromBody should throw when body is not an array', () => {
  gambitHelper.parseMessageIdFromBody.should.throw();
});

test('parseMessageIdFromBody should not throw when body is a non empty array', () => {
  gambitHelper.parseMessageIdFromBody([{ _id: 'abc' }]).should.be.eql('abc');
});

// getFailedAtUpdateBody
test('getFailedAtUpdateBody should return a valid payload', () => {
  const message = messageFactoryHelper.getValidTwilioOutboundErrorStatusData(moment().format());
  const payload = gambitHelper.getFailedAtUpdateBody(message.getData());
  payload.metadata.delivery.failedAt.should.exist;
  payload.metadata.delivery.failureData.code.exist;
  payload.metadata.delivery.failureData.message.exist;
});

// getDeliveredAtUpdateBody
test('getDeliveredAtUpdateBody should return a valid payload', () => {
  const message = messageFactoryHelper.getValidTwilioOutboundStatusData(moment().format());
  const payload = gambitHelper.getDeliveredAtUpdateBody(message.getData());
  payload.metadata.delivery.deliveredAt.should.exist;
});

// updateMessage
test.serial('updateMessage should call executeUpdate', async () => {
  sandbox.stub(gambitHelper, 'executeUpdate')
    .returns(Promise.resolve(true));
  const messageId = 'abc123';
  const path = gambitHelper.getUpdateMessagePath(messageId);
  const opts = { whats: 'up' };

  await gambitHelper.updateMessage(messageId, opts);
  gambitHelper.executeUpdate.should.have.been.calledWith(path, opts);
});

// getMessageToUpdate
test.serial('getMessageToUpdate should call getMessageIdBySid', async () => {
  sandbox.stub(gambitHelper, 'getMessageIdBySid')
    .returns(Promise.resolve(true));
  const message = messageFactoryHelper.getValidTwilioOutboundStatusData(moment().format());
  const messageSid = message.getData().MessageSid;
  const headers = gambitHelper.getRequestHeaders(message);

  await gambitHelper.getMessageToUpdate(message);
  gambitHelper.getMessageIdBySid.should.have.been.calledWith(messageSid, { headers });
});

// getMessageIdBySid
test.serial('getMessageIdBySid should call executeGet', async () => {
  sandbox.stub(gambitHelper, 'executeGet')
    .returns(Promise.resolve(true));
  const platformMessageId = 'abc123';
  const path = gambitHelper.getMessageIdBySidPath(platformMessageId);
  const opts = { whats: 'up' };

  await gambitHelper.getMessageIdBySid(platformMessageId, opts);
  gambitHelper.executeGet.should.have.been.calledWith(path, opts);
});

// getRequestHeaders
test('getRequestHeaders should return valid headers', () => {
  const message = messageFactoryHelper.getValidTwilioOutboundStatusData(moment().format());

  const headers = gambitHelper.getRequestHeaders(message);
  should.exist(headers.Authorization);
  should.exist(headers['X-Request-ID']);
  should.exist(headers['Content-type']);
});

// logFetchFailureAndRetry
test('logFetchFailureAndRetry should log and throw a BlinkRetryError error', () => {
  const message = messageFactoryHelper.getValidSmsActiveData();
  expect(() => gambitHelper.logFetchFailureAndRetry('msg', message, 'worker1')).to.throw(BlinkRetryError);
});

// relaySmsStatusActiveMessage
test.serial('relaySmsStatusActiveMessage should relay the message to the correct path', async () => {
  sandbox.stub(gambitHelper, 'relayMessage')
    .returns(Promise.resolve(true));
  const message = messageFactoryHelper.getValidSmsActiveData();
  const path = gambitHelper.getSubscriptionStatusActivePath();
  const opts = {
    body: JSON.stringify({ hello: 'world' }),
  };

  await gambitHelper.relaySmsStatusActiveMessage(message, opts);
  gambitHelper.relayMessage.should.have.been.calledWith(path, message, opts);
});

// relayCampaignSignupMessage
test.serial('relayCampaignSignupMessage should relay the message to the correct path', async () => {
  sandbox.stub(gambitHelper, 'relayMessage')
    .returns(Promise.resolve(true));
  const message = messageFactoryHelper.getValidCampaignSignup();
  const path = gambitHelper.getCampaignSignupPath();
  const opts = {
    body: JSON.stringify({ hello: 'world' }),
  };

  await gambitHelper.relayCampaignSignupMessage(message, opts);
  gambitHelper.relayMessage.should.have.been.calledWith(path, message, opts);
});

// relayBroadcastMessage
test.serial('relayBroadcastMessage should relay the message to the correct path', async () => {
  sandbox.stub(gambitHelper, 'relayMessage')
    .returns(Promise.resolve(true));
  const message = messageFactoryHelper.getValidGambitBroadcastData();
  const path = gambitHelper.getBroadcastPath();
  const opts = {
    body: JSON.stringify({ hello: 'world' }),
  };

  await gambitHelper.relayBroadcastMessage(message, opts);
  gambitHelper.relayMessage.should.have.been.calledWith(path, message, opts);
});

// relayTwilioInboundMessage
test.serial('relayTwilioInboundMessage should relay the message to the correct path', async () => {
  sandbox.stub(gambitHelper, 'relayMessage')
    .returns(Promise.resolve(true));
  const message = messageFactoryHelper.getValidInboundMessageData();
  const path = gambitHelper.getTwilioPath();
  const opts = {
    body: JSON.stringify({ hello: 'world' }),
  };

  await gambitHelper.relayTwilioInboundMessage(message, opts);
  gambitHelper.relayMessage.should.have.been.calledWith(path, message, opts);
});

// ------- End -----------------------------------------------------------------
