'use strict';

exports.config = {
  // AWS SQS config
  sqsSettings: {
    // @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/Welcome.html
    APIversion: '2012-11-05',
    // TODO: This could be gathered from the queue URL
    AWSRegion: process.env.BLINK_CIO_SMS_BROADCAST_QUEUE_REGION || 'us-east-1',
    QueueURL: process.env.BLINK_CIO_SMS_BROADCAST_QUEUE_URL,
  },
};
