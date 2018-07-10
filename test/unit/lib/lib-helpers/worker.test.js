'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const fetch = require('node-fetch');
const sinonChai = require('sinon-chai');

// ------- Internal imports ----------------------------------------------------

const workerHelper = require('../../../../src/lib/helpers/worker');
const blinkAppConfig = require('../../../../config/app');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();
const { Response } = fetch;

test.afterEach(() => {
  // reset stubs, spies, and mocks
  sandbox.restore();
});

// ------- Tests ---------------------------------------------------------------

/**
 * isAllowedHttpStatus
 */

test('workerHelper: isAllowedHttpStatus should return true for allowed status codes', () => {
  blinkAppConfig.allowedStatuses.forEach((statusCode) => {
    statusCode.should.be.a('number');
    workerHelper.isAllowedHttpStatus(statusCode).should.be.true;
  });
});

test('Test Gambit response with x-blink-retry-suppress header', () => {
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

  workerHelper.checkRetrySuppress(retrySuppressResponse).should.be.true;


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
  workerHelper.checkRetrySuppress(normalFailedResponse).should.be.false;
});

// ------- End -----------------------------------------------------------------
