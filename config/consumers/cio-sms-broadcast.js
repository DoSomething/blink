'use strict';

/**
 * @see https://github.com/BBC/sqs-consumer#options
 */
exports.config = {
  queueUrl: process.env.BLINK_CIO_SMS_BROADCAST_QUEUE_URL,
  handleMessageTimeout: '30000',
  batchSize: 1,
  visibilityTimeout: 30,
  waitTimeSeconds: 20,
  attributeNames: ['All'],
  messageAttributeNames: [
    // TODO: Forward to Gambit as X-Request-Id for backwards compatibility
    'Request-Id',
  ],
};
