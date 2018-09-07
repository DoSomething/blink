'use strict';

const lodash = require('lodash');

const config = require('../../../../../config');

const removePIIConfig = config.logger.transformers.removePII;
// merge all keys so lodash can do it's magic omitting them
const keysToOmit = [
  ...removePIIConfig.northstarPIIKeys,
  ...removePIIConfig.customerIoPIIKeys,
];

/**
 * filterPII - Filters out PII properties from the payload.data object
 *
 * @param  {Object} payload message payload object containing data and meta properties
 * @return {Object}         modified payload without PII
 */
function filterPII(payload) {
  payload.data = lodash.omit(payload.data, keysToOmit); // eslint-disable-line
  return payload;
}

/**
 * transformer - removes PII (Personal Identifiable Information)
 *
 * @param  {Object} payload message payload object containing data and meta properties
 * @return {Object}         transformed payload
 */
function transformer(payload = {}) {
  if (!removePIIConfig.enabled || !payload.data) {
    return payload;
  }
  return filterPII(payload);
}

module.exports = transformer;
