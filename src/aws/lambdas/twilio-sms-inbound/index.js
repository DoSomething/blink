'use strict';

const twilioClient = require('twilio');
const { STATUS_CODES } = require('http');
const querystring = require('querystring');
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
 * Returns the Twilio valid response
 * @see https://www.twilio.com/docs/sms/twiml#responding-to-twilio
 * @returns {Object}
 */
function getTwilioResponse() {
  return {
    // Twilio expects 200
    statusCode: 200,
    /**
     * If headers are not what Twiml expects we will see this request in the Twilio Debugger
     * reported as an error, even if processed correctly on our end
     */
    headers: {
      'Content-Type': 'text/xml',
    },
    // should be empty
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
 * @param {String} statusCode
 * @param {Object} body
 */
function getResponse(statusCode = 200, body) {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
}

/**
 * Returns Twilio signature from headers
 * @param {Object} eventHeaders
 * @returns String
 */
function getSignature(eventHeaders) {
  return eventHeaders[config.signatureHeader];
}

/**
 * Returns the constructed URL that Twilio sent this request to.
 * It's important to get it correct since Twilio uses it as part of their hash algorithm.
 * @param {Object} eventRequestContext
 */
function getSignatureURL(eventRequestContext) {
  // If we use AWS DNS, the protocol will always be https
  const protocol = 'https';
  // The domain name is the API Gateway domain
  const domain = eventRequestContext.domainName;
  // Includes forward slash, stage and resource path
  const path = eventRequestContext.path;
  /**
   * The Twilio request includes the query parameters with the API key.
   * We need to add them here, otherwise the generated hash won't validate
   * with the signature sent from Twilio
   */
  return `${protocol}://${domain}${path}?${config.apiKeyQueryVarName}=${config.apiKeyQueryVarValue}`;
}

/**
 * Checks if the request was signed by Twilio
 * @see https://www.twilio.com/docs/usage/security#validating-requests
 * @param {Object} eventHeaders
 * @param {Object} eventRequestContext
 * @param {String} payload      x-www-form-urlencoded string of the payload POSTed by Twilio
 */
function validateTwilioSignedRequest(eventHeaders, eventRequestContext, eventBody) {
  // Signature Twilio embedded in the headers for validation
  const signature = getSignature(eventHeaders);
  // short circuit if there is no signature
  if (!signature) return false;
  // Reconstructed URL Twilio sent the inbound request to
  const url = getSignatureURL(eventRequestContext);
  /**
   * Twilio sends the payload with 'Content-Type': 'application/x-www-form-urlencoded'
   * but the validateRequest utility function expects the payload as an object :facepalm:
   */
  const body = querystring.parse(eventBody);

  return twilioClient.validateRequest(config.authToken, signature, url, body);
}

function validateTestRequest(eventHeaders) {
  return eventHeaders[config.testHeader] === config.testKey;
}

/**
 * Builds the message params needed to enqueue the message
 * @see https://docs.aws.amazon.com/AWSSimpleQueueService/latest/APIReference/API_SendMessage.html
 * @param {String} body
 */
function getMessageParams(body) {
  // Parse into a JS Object
  const parsedBody = querystring.parse(body);
  return {
    // TODO: pass message attributes
    MessageAttributes: {},
    // Required to keep order within the message group
    MessageGroupId: parsedBody.From,
    // Required if deduplication is not based on body contents hash
    MessageDeduplicationId: parsedBody.MessageSid,
    MessageBody: body,
    QueueUrl: config.sqsSettings.QueueURL,
  };
}

function publishMessage(messageParams, cb) {
  // TODO: Check if cb is a function
  sqsClient.sendMessage(messageParams, cb);
}

/**
 * This lambda function will receive Twilio inbound SMS requests and will enqueue into SQS
 */

// Lambda will pass event and context arguments to this function
exports.handler = (event, context, callback) => {
  const isTwilioSignedRequest = validateTwilioSignedRequest(
    event.headers, event.requestContext, event.body);

  // TODO: For dev testing purposes only
  const isTestRequest = validateTestRequest(event.headers);

  if (isTwilioSignedRequest) {
    logger.info('Valid Twilio signed request.');
    // Enqueue inbound message
    const messageParams = getMessageParams(event.body);
    publishMessage(messageParams, (error) => {
      if (!error) {
        return callback(null, getTwilioResponse());
      }
      // Expose error for monitoring
      logger.error(error);
      return callback(null, getErrorResponse());
    });
  } else if (isTestRequest) {
    logger.info('Valid Test request.');
    callback(null, getResponse(200, event.body));
  } else {
    logger.info('Invalid request.');
    callback(null, getErrorResponse(403));
  }
};
