'use strict';

/**
 * Test environment overrides.
 *
 * Ignoring no-param-reassign eslint rule because it's exactly what we want here.
 */

/* eslint-disable no-param-reassign */

module.exports = (config) => {
  // Randomize port for test runner.
  // Port 0 means random port:
  // https://nodejs.org/api/http.html#http_server_listen_port_hostname_backlog_callback
  config.web.bind_port = 0;
  config.web.bind_address = '127.0.0.1';
  config.twilio.authToken = 'testtoken';
  // logger transformers
  config.logger.transformers.removePII.enabled = true;
};
