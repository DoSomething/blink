'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const RedisConnectionManager = require('../../../../src/lib/RedisConnectionManager');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * RedisRetryDelayer.connect(): Test Redis connection
 */
test('RedisRetryDelayer.connect(): Test Redis connection', async () => {
  const config = require('../../../../config');

  const redis = new RedisConnectionManager(config.redis);
  const connected = await redis.connect();
  connected.should.be.true;
});

// ------- End -----------------------------------------------------------------
