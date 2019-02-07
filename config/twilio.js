'use strict';

const config = {
  accountSid: process.env.TWILIO_API_ACCOUNT_SID || 'AC-account_sid',
  // overridden by `config/env/override-test` while testing
  authToken: process.env.TWILIO_API_AUTH_TOKEN || 'totallysecret',
};

module.exports = config;
