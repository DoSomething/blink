'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');

const gambitHelper = require('../../../src/workers/lib/helpers/gambit-conversations');
const GambitCampaignSignupRelayWorker = require('../../../src/workers/GambitCampaignSignupRelayWorker');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

const should = chai.should();
const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

test('getLogCode should be setup and have correct logs', () => {
  const logNames = ['retry', 'success', 'suppress', 'unprocessable', 'skip'];

  logNames.forEach((name) => {
    const code = GambitCampaignSignupRelayWorker.getLogCode(name);
    should.exist(code);

    if (code) {
      code.should.contain('gambit_campaign_signup');
    }
  });
});

test('Gambit should receive correct retry count if message has been retried', () => {
  // No retry property:
  gambitHelper.getRequestHeaders(MessageFactoryHelper.getCampaignSignupMessage())
    .should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getCampaignSignupMessage();
  gambitHelper.getRequestHeaders(retriedZero)
    .should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getCampaignSignupMessage();
  retriedOnce.incrementRetryAttempt();
  gambitHelper.getRequestHeaders(retriedOnce)
    .should.have.property('x-blink-retry-count').and.equal(1);
});

test('Gambit should receive signups not created by Gambit', () => {
  // Helper specifically will not return sms-related signup source.
  const message = MessageFactoryHelper.getCampaignSignupMessage();
  GambitCampaignSignupRelayWorker.shouldSkip(message).should.be.false;
});

test('Gambit should not recieve signups created by Gambit', () => {
  const message = MessageFactoryHelper.getCampaignSignupMessage();
  const smsRelatedSources = [
    'sms',
    `sms${chance.word()}`,
    `sms-${chance.word()}`,
    `sms${chance.natural()}`,
    'sms ',
    ' sms ',
    ` sms${chance.word()}`,
  ];

  smsRelatedSources.forEach((source) => {
    message.payload.data.source = source;
    GambitCampaignSignupRelayWorker.shouldSkip(message).should.be.true;
  });
});

// ------- End -----------------------------------------------------------------
