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

  // Test exchange name.
  // TODO: Randomize exchange name.
  config.amqp.exchange = 'test-x';
};
