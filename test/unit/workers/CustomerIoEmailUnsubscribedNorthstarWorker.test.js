'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const rewire = require('rewire');

const northstarHelper = rewire('../../../src/workers/lib/helpers/northstar');
const CustomerIoEmailUnsubscribedNorthstarWorker = require('../../../src/workers/CustomerIoEmailUnsubscribedNorthstarWorker');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');


northstarHelper.__set__('identityService', {
  getAuthHeader: () => ({ Autorization: 'Bearer 12345' }),
});

// ------- Init ----------------------------------------------------------------

const should = chai.should();
// ------- Tests ---------------------------------------------------------------

test('getLogCode should be setup and have correct logs', () => {
  const logNames = ['retry', 'success', 'suppress', 'unprocessable'];

  logNames.forEach((name) => {
    const code = CustomerIoEmailUnsubscribedNorthstarWorker.getLogCode(name);
    should.exist(code);

    if (code) {
      code.should.contain('customerio_email_unsubscribed_northstar');
    }
  });
});

test('Northstar should receive correct retry count if message has been retried', async () => {
  // No retry property:
  const headers = await northstarHelper
    .getRequestHeaders(MessageFactoryHelper.getValidCustomerIoWebhookMessage());
  headers.should.not.have.property('x-blink-retry-count');

  // retry = 0
  const retriedZero = MessageFactoryHelper.getValidCustomerIoWebhookMessage();
  const headersRetry0 = await northstarHelper.getRequestHeaders(retriedZero);
  headersRetry0.should.not.have.property('x-blink-retry-count');

  // retry = 1
  const retriedOnce = MessageFactoryHelper.getValidCustomerIoWebhookMessage();
  retriedOnce.incrementRetryAttempt();
  const headersRetry1 = await northstarHelper.getRequestHeaders(retriedOnce);
  headersRetry1.should.have.property('x-blink-retry-count').and.equal(1);
});

// ------- End -----------------------------------------------------------------
