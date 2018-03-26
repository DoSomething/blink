'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

// ------- Internal imports ----------------------------------------------------

const workerHelper = require('../../../../src/lib/helpers/worker');
const blinkAppConfig = require('../../../../config/app');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

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

// ------- End -----------------------------------------------------------------
