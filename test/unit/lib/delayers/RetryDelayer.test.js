'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// ------- Internal imports ----------------------------------------------------

const RetryDelayer = require('../../../../src/lib/delayers/RetryDelayer');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(chaiAsPromised);

// ------- Tests ---------------------------------------------------------------

/**
 * InMemoryRetryDelayer: interface
 */
test('RetryDelayer: Test interface', async () => {
  const retryDelayer = new RetryDelayer();
  retryDelayer.should.respondTo('delayMessageRetry');
  // Ensure RetryDelayer require overriding delayMessageRetry.
  const delayPromise = retryDelayer.delayMessageRetry();
  await delayPromise.should.be.rejectedWith(TypeError);
});

// ------- End -----------------------------------------------------------------
