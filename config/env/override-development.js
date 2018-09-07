'use strict';

/**
 * Test environment overrides.
 *
 * Ignoring no-param-reassign eslint rule because it's exactly what we want here.
 */

/* eslint-disable no-param-reassign */

module.exports = (config) => {
  config.logger.transformers.removePII.enabled = false;
};
