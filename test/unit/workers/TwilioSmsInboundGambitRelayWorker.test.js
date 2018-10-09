'use strict';

// ------- Imports -------------------------------------------------------------

const chai = require('chai');
const test = require('ava');

const gambitHelper = require('../../../src/workers/lib/helpers/gambit-conversations');
const TwilioSmsInboundGambitRelayWorker = require('../../../src/workers/TwilioSmsInboundGambitRelayWorker');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

const should = chai.should();

// ------- Tests ---------------------------------------------------------------

test('getLogCode should be setup and have correct logs', () => {
  const logNames = ['retry', 'success', 'suppress', 'unprocessable'];

  logNames.forEach((name) => {
    const code = TwilioSmsInboundGambitRelayWorker.getLogCode(name);
    should.exist(code);

    if (code) {
      code.should.contain('gambit_inbound');
    }
  });
});

test('Gambit Broadcast relay should receive correct retry count if message has been retried', () => {
  // No retry property:
  gambitHelper.getRequestHeaders(MessageFactoryHelper.getTwilioInboundMessage())
    .should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getTwilioInboundMessage();
  gambitHelper.getRequestHeaders(retriedZero)
    .should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getTwilioInboundMessage();
  retriedOnce.incrementRetryAttempt();
  gambitHelper.getRequestHeaders(retriedOnce)
    .should.have.property('x-blink-retry-count').and.equal(1);
});

// ------- End -----------------------------------------------------------------
