'use strict';

exports.config = {
  accountSid: process.env.TWILIO_API_ACCOUNT_SID,
  authToken: process.env.TWILIO_API_AUTH_TOKEN,
  signatureHeader: process.env.TWILIO_API_SIGNATURE_HEADER || 'X-Twilio-Signature',
  validateSignature: process.env.TWILIO_API_VALIDATE_SIGNATURE === 'true',
  testKey: process.env.LAMBDA_TEST_REQUEST_KEY,
  testHeader: process.env.LAMBDA_TEST_REQUEST_HEADER || 'X-Lambda-Test-Key',
};
