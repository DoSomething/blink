'use strict';

const { STATUS_CODES } = require('http');
const AWS = require('aws-sdk');

const { config } = require('./config');

// setup SQS client
// TODO: Move to lib/sqs/client
// Region
AWS.config.update({ region: config.sqsSettings.AWSRegion });
const sqsClient = new AWS.SQS({ apiVersion: config.sqsSettings.APIversion });

// Dummy logger
const logger = {
  // TODO: enable linter once we decide which logger to use in lambdas
  info: msg => console.log(msg), // eslint-disable-line
  error: msg => console.error(msg), // eslint-disable-line
};

/**
 * Returns the Cio valid response
 * @returns {Object}
 */
function getCioResponse() {
  return {
    statusCode: 201,
    headers: {
      'Content-Type': 'text/xml',
    },
    body: '',
  };
}

function getErrorResponse(statusCode = 500, message) {
  return {
    statusCode,
    body: message || STATUS_CODES[statusCode],
  };
}

/**
 * Builds the message params needed to enqueue the message
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html
 * @param {String} body
 */
function getMessageParams(body, requestId) {
  logger.info(body);
  return {
    /**
     * TODO: ALL Messages queued should keep the request Id as a Message Attribute.
     * This will be used to make the request idempotent in Gambit
     * (if the same request w/ request_id is sent it would just load it).
     */
    MessageAttributes: {
      'Request-Id': {
        DataType: 'String',
        StringValue: requestId,
      },
    },
    MessageBody: body,
    QueueUrl: config.sqsSettings.QueueURL,
  };
}

function publishMessage(messageParams, cb) {
  // TODO: Check if cb is a function
  sqsClient.sendMessage(messageParams, cb);
}

exports.handler = (event, context, callback) => {
  logger.info('Cio Broadcast request.');
  // Enqueue inbound message
  const messageParams = getMessageParams(event.body, event.requestContext.requestId);
  publishMessage(messageParams, (error) => {
    if (!error) {
      return callback(null, getCioResponse());
    }
    // Expose error for monitoring
    logger.error(error);
    return callback(null, getErrorResponse());
  });
};
