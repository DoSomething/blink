'use strict';

const { URL } = require('url');

const redisUrl = process.env.REDIS_URL || 'redis://redis@localhost:6379';
// @see https://nodejs.org/docs/latest-v8.x/api/url.html#url_the_whatwg_url_api
const parsedRedisUrl = new URL(redisUrl);

const config = {
  connection: {
    // host and port are overridden by the Wercker CI job
    host: process.env.BLINK_REDIS_HOST || parsedRedisUrl.hostname,
    port: process.env.BLINK_REDIS_PORT || parsedRedisUrl.port,
    user: process.env.BLINK_REDIS_USER || parsedRedisUrl.username,
    password: process.env.BLINK_REDIS_PASSWORD || parsedRedisUrl.password,
  },
  settings: {
    retrySet: process.env.BLINK_REDIS_RETRY_SET_NAME || 'blink_retries',
    retrySetProcessLimit: process.env.BLINK_REDIS_RETRY_SET_PROCESS_LIMIT || 100,
  },
};

module.exports = config;
