'use strict';

const fs = require('fs');

// Settings.
const config = {
  workers: {},
  logger: {},
};

// Setup global logger instance.
require('./logger');

// Configuration
config.app = require('./app');
config.amqp = require('./amqp');
config.amqpManagement = require('./amqpManagement');
config.customerio = require('./customerio');
config.logger.transformers = require('./lib/helpers/logger/transformers');
config.redis = require('./redis');
config.twilio = require('./twilio');
config.web = require('./web');
config.workers.gambitConversations = require('./workers/lib/helpers/gambit-conversations');
config.workers.northstar = require('./workers/lib/helpers/northstar');
config.workers.identity = require('./workers/lib/identity-service');


// Require env-dependent configs
const envConfigPath = `${__dirname}/env/override-${config.app.env}.js`;

try {
  const stats = fs.lstatSync(envConfigPath);
  if (stats.isFile()) {
    // Apply environment overrides.
    // We really want dynamic require here, so forcing eslint to ignore next line.
    // eslint-disable-next-line import/no-dynamic-require, global-require
    require(envConfigPath)(config);
  }
} catch (error) {
  // Just don't include env-dependent override when there's no file.
}

module.exports = config;
