'use strict';

const logger = require('winston');

const blinkAppConfig = require('../../../config/app');
const BlinkRetryError = require('../../errors/BlinkRetryError');

/**
 * checkRetrySuppress - Looks for the suppress headers in the node-fetch response
 *
 * @param  {Object} response node-fetch response
 * @return {boolean}
 */
function checkRetrySuppress(response) {
  const headerResult = response.headers.get(blinkAppConfig.retrySuppressHeader);
  if (!headerResult) {
    return false;
  }
  return headerResult.toLowerCase() === 'true';
}


/**
 * isAllowedHttpStatus
 *
 * @param  {number} statusCode
 * @return {boolean}
 */
function isAllowedHttpStatus(statusCode) {
  return blinkAppConfig.allowedStatuses.includes(statusCode);
}

/**
 * shouldRetry - The request should not retry if the status code is one of the allowed codes, or
 * if G-Conversations returned the suppress retry header
 *
 * @param  {Object} response node-fetch response
 * @return {boolean}
 */
function shouldRetry(response) {
  const allowedStatus = module.exports.isAllowedHttpStatus(response.status);
  const suppressed = module.exports.checkRetrySuppress(response);

  if (suppressed || allowedStatus) {
    return false;
  }
  return true;
}

/**
 * logFetchFailure
 *
 * @param {String} logMessage
 * @param {Object} message
 * @param {String} queueName
 * @param {String} code
 */
function logFetchFailureAndRetry(logMessage,
  message = {}, workerName, code = 'unexpected_code') {
  const meta = {
    code,
    worker: workerName,
    request_id: message ? message.getRequestId() : 'not_parsed',
  };
  logger.log('error', logMessage, meta);

  throw new BlinkRetryError(
    logMessage,
    message,
  );
}

module.exports = {
  shouldRetry,
  checkRetrySuppress,
  isAllowedHttpStatus,
  logFetchFailureAndRetry,
};
