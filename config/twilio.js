'use strict';

const useTestCreds = process.env.TWILIO_API_TEST_CREDS === 'true';
const envPrefix = useTestCreds ? 'TWILIO_API_TEST_' : 'TWILIO_API_';

const config = {
  useTestCreds,
  accountSid: process.env[`${envPrefix}ACCOUNT_SID`] || 'account_sid',
  authToken: process.env[`${envPrefix}AUTH_TOKEN`] || 'totallysecret',
  from: process.env[`${envPrefix}FROM`] || '+15005550006',
};

module.exports = config;
