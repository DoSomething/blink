'use strict';

const lodash = require('lodash');

const config = require('../../../../../config');

const leanifyConfig = config.logger.transformers.leanify;
// merge all keys so lodash can do it's magic omitting them
const keysToOmit = [
  ...leanifyConfig.bloatKeys,
];

/**
 * leanify - Filters out bloating properties from the payload.data object
 *
 * @param  {Object} payload message payload object containing data and meta properties
 * @return {Object}         modified payload without bloating keys
 */
function leanify(payload) {
  payload.data = lodash.omit(payload.data, keysToOmit); // eslint-disable-line
  return payload;
}

/**
 * transformer
 *
 * @param  {Object} payload message payload object containing data and meta properties
 * @return {Object}         transformed payload
 */
function transformer(payload = {}) {
  if (!leanifyConfig.enabled || !payload.data) {
    return payload;
  }
  return leanify(payload);
}

module.exports = transformer;
