'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const DelayLogic = require('../../../../src/lib/delayers/DelayLogic');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Dequeuer.retryDelay(): Check retryDelay behavior
 */
test('DelayLogic.exponentialBackoff(): Check exponentialBackoff behavior', () => {
  // First, delay between retries should be a matter of seconds
  DelayLogic.exponentialBackoff(1).should.be.equal(1250);
  DelayLogic.exponentialBackoff(2).should.be.equal(2000);

  // Delay should be between 20 and 30 sec on 10th retry.
  DelayLogic.exponentialBackoff(10).should.be.above(20000).and.below(30000);

  // Delay should be between 1 and 2 minutes on 20th retry.
  DelayLogic.exponentialBackoff(20).should.be.above(1 * 60 * 1000).and.below(2 * 60 * 1000);

  // Delay should be between 3 and 4 minutes on 30th retry.
  DelayLogic.exponentialBackoff(30).should.be.above(3 * 60 * 1000).and.below(4 * 60 * 1000);

  // Delay should be between 10 and 20 minutes on 50th retry.
  DelayLogic.exponentialBackoff(50).should.be.above(10 * 60 * 1000).and.below(20 * 60 * 1000);

  // Delay should be between 30 minutes and 1 hour on 100th retry.
  DelayLogic.exponentialBackoff(100).should.be.above(30 * 60 * 1000).and.below(60 * 60 * 1000);

  // Total wait time whould be less than a day.
  let retry = 0;
  let accumulator = 0;
  while (retry <= 100) {
    accumulator += DelayLogic.exponentialBackoff(retry);
    retry += 1;
  }
  accumulator.should.be.below(60 * 60 * 1000 * 24);
});

// ------- End -----------------------------------------------------------------
