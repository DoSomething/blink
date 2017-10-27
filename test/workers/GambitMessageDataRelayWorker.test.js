'use strict';

// ------- Imports -------------------------------------------------------------

const chai = require('chai');
const fetch = require('node-fetch');
const test = require('ava');

const BlinkWorkerApp = require('../../src/app/BlinkWorkerApp');
const GambitMessageDataRelayWorker = require('../../src/workers/GambitMessageDataRelayWorker');
const MessageFactoryHelper = require('../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const { Response } = fetch;

// ------- Tests ---------------------------------------------------------------

test('Gambit should recieve correct retry count if message has been retried', () => {
  const config = require('../../config');
  const gambitWorkerApp = new BlinkWorkerApp(config, 'gambit-message-data-relay');
  const gambitWorker = gambitWorkerApp.worker;

  // No retry property:
  gambitWorker.getRequestHeaders(MessageFactoryHelper.getValidMessageData())
    .should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getValidMessageData();
  gambitWorker.getRequestHeaders(retriedZero)
    .should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getValidMessageData();
  retriedOnce.incrementRetryAttempt();
  gambitWorker.getRequestHeaders(retriedOnce)
    .should.have.property('x-blink-retry-count').and.equal(1);
});


test('Test Gambit response with x-blink-retry-suppress header', () => {
  const config = require('../../config');
  const gambitWorkerApp = new BlinkWorkerApp(config, 'gambit-message-data-relay');
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

test('Gambit should process inbound messages', () => {
  const messageData = MessageFactoryHelper.getValidMessageData();
  GambitMessageDataRelayWorker.shouldSkip(messageData).should.be.false;
});

test('Gambit should not process not inbound messages', () => {
  const messageData = MessageFactoryHelper.getValidMessageData();
  messageData.payload.data.SmsStatus = 'out';
  GambitMessageDataRelayWorker.shouldSkip(messageData).should.be.true;
});

// ------- End -----------------------------------------------------------------
