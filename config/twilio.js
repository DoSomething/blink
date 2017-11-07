'use strict';

const config = {
  accountSid: process.env.TWILIO_API_ACCOUNT_SID || 'account_sid',
  authToken: process.env.TWILIO_API_AUTH_TOKEN || 'totallysecret',
  serviceSid: process.env.TWILIO_API_SERVICE_SID || 'totallysecret',
};

module.exports = config;
