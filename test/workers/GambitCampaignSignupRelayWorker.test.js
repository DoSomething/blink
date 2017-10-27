'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');
const fetch = require('node-fetch');

const BlinkWorkerApp = require('../../src/app/BlinkWorkerApp');
const GambitCampaignSignupRelayWorker = require('../../src/workers/GambitCampaignSignupRelayWorker');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const { Response } = fetch;
const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

test('Gambit should recieve correct retry count if message has been retried', () => {
  const config = require('../../config');
  const gambitWorkerApp = new BlinkWorkerApp(config, 'gambit-campaign-signup-relay');
  const gambitWorker = gambitWorkerApp.worker;

  // No retry property:
  gambitWorker.getRequestHeaders(MessageFactoryHelper.getValidMdata())
    .should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getValidMdata();
  gambitWorker.getRequestHeaders(retriedZero)
    .should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getValidMdata();
  retriedOnce.incrementRetryAttempt();
  gambitWorker.getRequestHeaders(retriedOnce)
    .should.have.property('x-blink-retry-count').and.equal(1);
});


test('Test Gambit response with x-blink-retry-suppress header', () => {
  const config = require('../../config');
  const gambitWorkerApp = new BlinkWorkerApp(config, 'gambit-campaign-signup-relay');
  const gambitWorker = gambitWorkerApp.worker;

  // Gambit order retry suppression
  const retrySuppressResponse = new Response(
    'Unknown Gambit error',
    {
      status: 422,
      statusText: 'Unknown Gambit error',
      headers: {
        // Also make sure that blink recongnizes non standart header case
        'X-BlInK-RetRY-SuPPRESS': 'TRUE',
      },
    },
  );

  gambitWorker.checkRetrySuppress(retrySuppressResponse).should.be.true;


  // Normal Gambit 422 response
  const normalFailedResponse = new Response(
    'Unknown Gambit error',
    {
      status: 422,
      statusText: 'Unknown Gambit error',
      headers: {
        'x-taco-count': 'infinity',
      },
    },
  );
  gambitWorker.checkRetrySuppress(normalFailedResponse).should.be.false;
});

test('Gambit should recieve signups not created by Gambit', () => {
  // Helper specifically will not return sms-related signup source.
  const message = MessageFactoryHelper.getValidCampaignSignup();
  GambitCampaignSignupRelayWorker.shouldSkip(message).should.be.false;
});

test('Gambit should not recieve signups created by Gambit', () => {
  const message = MessageFactoryHelper.getValidCampaignSignup();
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
