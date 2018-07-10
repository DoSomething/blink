'use strict';

// ------- Imports -------------------------------------------------------------

const chai = require('chai');
const test = require('ava');

const gambitHelper = require('../../../src/lib/helpers/gambit');
const CustomerIoGambitBroadcastWorker = require('../../../src/workers/CustomerIoGambitBroadcastWorker');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

const should = chai.should();

// ------- Tests ---------------------------------------------------------------

test('getLogCode should be setup and have correct logs', () => {
  const logNames = ['retry', 'success', 'suppress', 'unprocessable'];

  logNames.forEach((name) => {
    const code = CustomerIoGambitBroadcastWorker.getLogCode(name);
    should.exist(code);

    if (code) {
      code.should.contain('customerio_gambit_broadcast');
    }
  });
});

test('Gambit Broadcast relay should receive correct retry count if message has been retried', () => {
  const broadcastId = MessageFactoryHelper.getFakeUserId();

  // No retry property:
  gambitHelper.getRequestHeaders(MessageFactoryHelper.getValidGambitBroadcastData(broadcastId))
    .should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getValidGambitBroadcastData(broadcastId);
  gambitHelper.getRequestHeaders(retriedZero)
    .should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getValidGambitBroadcastData(broadcastId);
  retriedOnce.incrementRetryAttempt();
  gambitHelper.getRequestHeaders(retriedOnce)
    .should.have.property('x-blink-retry-count').and.equal(1);
});

// ------- End -----------------------------------------------------------------
