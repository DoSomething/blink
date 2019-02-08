'use strict';

/**
 * Heroku makes it available to help calculate correct concurrency
 * @see https://devcenter.heroku.com/articles/node-concurrency#tuning-the-concurrency-level
 */
const memoryAvailable = parseInt(process.env.MEMORY_AVAILABLE, 10);

/**
 * Expected MAX memory footprint of a single concurrent process in Megabytes.
 *
 * NOTE: This value is the basis to calculate the Procfile server flag: --max_old_space_size=<size>
 *       The value in the Procfile is 90% of the estimated processMemory here.
 *       Based on a Heroku recommendation. @see https://blog.heroku.com/node-habits-2016#7-avoid-garbage
 */
const processMemory = 32;

/**
 * Calculate total amount of concurrent processes to fork
 * based on available memory and estimated process memory footprint
 */
const total = memoryAvailable ?
  Math.floor(memoryAvailable / processMemory) : 1;

/**
 * @see https://github.com/BBC/sqs-consumer#options
 */
exports.config = {
  concurrency: total,
  handler: {
    queueUrl: process.env.BLINK_CIO_SMS_BROADCAST_QUEUE_URL,
    handleMessageTimeout: '30000',
    // @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ReceiveMessage.html (MaxNumberOfMessages)
    // Max of 10
    batchSize: 10,
    visibilityTimeout: 30,
    waitTimeSeconds: 20,
    attributeNames: ['All'],
    messageAttributeNames: [
      // TODO: Forward to Gambit as X-Request-Id for backwards compatibility
      'Request-Id',
    ],
  },
};
