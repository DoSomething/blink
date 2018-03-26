'use strict';

const blinkAppConfig = require('../../../config/app');

/**
 * checkRetrySuppress - Looks for the suppress headers in the node-fetch response
 *
 * @param  {Object} response node-fetch response
 * @return {boolean}
 */
module.exports.checkRetrySuppress = function checkRetrySuppress(response) {
  const headerResult = response.headers.get(blinkAppConfig.retrySuppressHeader);
  if (!headerResult) {
    return false;
  }
  return headerResult.toLowerCase() === 'true';
};


/**
 * isAllowedHttpStatus
 *
 * @param  {number} statusCode
 * @return {boolean}
 */
module.exports.isAllowedHttpStatus = function isAllowedHttpStatus(statusCode) {
  return blinkAppConfig.allowedStatuses.includes(statusCode);
};

/**
 * shouldRetry - The request should not retry if the status code is one of the allowed codes, or
 * if G-Conversations returned the suppress retry header
 *
 * @param  {Object} response node-fetch response
 * @return {boolean}
 */
module.exports.shouldRetry = function shouldRetry(response) {
  const allowedStatus = exports.isAllowedHttpStatus(response.status);
  const suppressed = exports.checkRetrySuppress(response);

  if (suppressed || allowedStatus) {
    return false;
  }
  return true;
};
