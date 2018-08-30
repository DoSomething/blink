'use strict';

const fetch = require('node-fetch');
/**
 * Deep Extend is used because Object.assign does shallow-copy only. Nested objects are
 * referenced instead of copied which can bring unintended consequences.
 */
const deepExtend = require('deep-extend');
const northstarHelperConfig = require('../../../../config/workers/lib/helpers/northstar');
const IdentityService = require('../identity-service');

let identityService;

function getIdentityService() {
  if (!identityService) {
    identityService = new IdentityService();
  }
  return identityService;
}

/**
 * executeUpdate - Sends a PUT request to the baseURL host and given path
 *
 * @param  {string} path
 * @param  {Object} opts = {} @see https://www.npmjs.com/package/node-fetch#options
 * @return {Promise}
 */
function executeUpdate(path, opts = {}) {
  const options = deepExtend({}, opts, {
    method: 'PUT',
  });
  return fetch(`${northstarHelperConfig.baseURL}/${path}`, options);
}

/**
 * updateUserById - Updates an user in Northstar by userId.
 *
 * @async
 * @param  {String} userId
 * @param  {Object} opts     Already includes the headers in the object.
 * @return {Promise}
 */
async function updateUserById(userId, opts) {
  return module.exports.executeUpdate(`users/${userId}`, opts);
}

/**
 * getRequestHeaders - Get Northstar specific headers for this message
 *
 * @async
 * @param  {Object} message
 * @return {Promise<Object>}
 */
async function getRequestHeaders(message) {
  const identityServiceClient = module.exports.getIdentityService();
  const authorizationHeader = await identityServiceClient.getAuthHeader();
  const headers = {
    ...authorizationHeader,
    'X-Request-ID': message.getRequestId(),
    'Content-type': 'application/json',
  };
  if (message.getRetryAttempt() > 0) {
    headers['x-blink-retry-count'] = message.getRetryAttempt();
  }
  return headers;
}

module.exports = {
  executeUpdate,
  updateUserById,
  getRequestHeaders,
  getIdentityService,
};
