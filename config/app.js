'use strict';

const packageJson = require('../package.json');

const config = {
  name: process.env.BLINK_APP_NAME || 'blink',
  env: process.env.NODE_ENV || 'development',
  auth: {
    name: process.env.BLINK_APP_AUTH_NAME || 'blink',
    password: process.env.BLINK_APP_AUTH_PASSWORD || 'blink',
  },
  version: packageJson.version,
  retrySuppressHeader: 'x-blink-retry-suppress',
  prefetchCount: parseInt(process.env.BLINK_APP_DEFAULT_PREFETCH_COUNT, 10) || 30,
  rateLimit: parseInt(process.env.BLINK_APP_DEFAULT_RATE_LIMIT, 10) || 60,
};

module.exports = config;
