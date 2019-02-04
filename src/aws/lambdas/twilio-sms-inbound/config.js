'use strict';

/**
 * TODO: There should be a way to pull all of these variables from a central place.
 * As we make more Lambda function, we will need to share secrets among them.
 */
exports.config = {
  accountSid: process.env.TWILIO_API_ACCOUNT_SID,
  authToken: process.env.TWILIO_API_AUTH_TOKEN,
  signatureHeader: process.env.TWILIO_API_SIGNATURE_HEADER || 'X-Twilio-Signature',
  validateSignature: process.env.TWILIO_API_VALIDATE_SIGNATURE === 'true',
  testKey: process.env.LAMBDA_TEST_REQUEST_KEY,
  testHeader: process.env.LAMBDA_TEST_REQUEST_HEADER || 'X-Lambda-Test-Key',
  // TODO: Naming and nesting can help with readability
  // Blink API Key
  apiKeyQueryVarName: process.env.API_KEY_QUERY_VARIABLE_NAME || 'blinkApiKey',
  apiKeyQueryVarValue: process.env.API_KEY_QUERY_VARIABLE_VALUE,
  // AWS SQS config
  sqsSettings: {
    // @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/Welcome.html
    APIversion: '2012-11-05',
    // TODO: This could be gathered from the queue URL
    AWSRegion: process.env.BLINK_TWILIO_SMS_INBOUND_QUEUE_REGION || 'us-east-1',
    QueueURL: process.env.BLINK_TWILIO_SMS_INBOUND_QUEUE_URL,
  },
};
