'use strict';

/**
 * Heroku makes it available to help calculate correct concurrency
 * @see https://devcenter.heroku.com/articles/node-concurrency#tuning-the-concurrency-level
 */
const memoryAvailable = parseInt(process.env.MEMORY_AVAILABLE, 10);

/**
 * Expected MAX memory footprint of a single concurrent process in Megabytes.
 *
 * NOTE: This value is the basis to calculate the V8 server flag: --max_old_space_size=<size>
 *       The value in the consumer NPM script is 90% of the estimated processMemory here.
 *       Based on a Heroku recommendation. @see https://blog.heroku.com/node-habits-2016#7-avoid-garbage
 */
const processMemory = 128;

/**
 * Calculate total amount of concurrent processes to fork
 * based on available memory and estimated process memory footprint
 */
const concurrency = memoryAvailable ?
  Math.floor(memoryAvailable / processMemory) : 1;

/**
 * Concurrency for this consumer is calculated automatically from the available memory
 * and the estimated memory allocated for this process. However, this calculation can
 * be overridden by passing a value to BLINK_CIO_SMS_BROADCAST_CONCURRENCY
 */
const concurrencyOverride = parseInt(process.env.BLINK_CIO_SMS_BROADCAST_CONCURRENCY, 10);

/**
 * @see https://github.com/BBC/sqs-consumer#options
 */
exports.config = {
  concurrency: concurrencyOverride || concurrency,
  // @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_ReceiveMessage.html
  handler: {
    queueUrl: process.env.BLINK_CIO_SMS_BROADCAST_QUEUE_URL,
    // How long before the handler function times out
    handleMessageTimeout: '30000',
    // AWS param: MaxNumberOfMessages (Max of 10)
    // Since we are using clustering. The total messages we can consume concurrently from AWS is
    // concurrency * batchSize.
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
