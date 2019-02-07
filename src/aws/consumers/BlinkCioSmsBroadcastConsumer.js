'use strict';

const Consumer = require('sqs-consumer');
const logger = require('../../../config/logger');

const { config } = require('../../../config/consumers/cio-sms-broadcast');

function handler(message) {
  // TODO: Implement handler that will be called by the long polling consumer.
  logger.info(JSON.stringify(message)); // eslint-disable-line
}

const app = Consumer.create({
  handleMessage: handler,
  ...config,
});

// Register event handlers
app.on('error', (error, msg) => logger.error(`Error ocurred\nError: ${error}\nMessage:${msg || 'n/a'}\n`));
app.on('processing_error', (error, msg) => logger.error(`Error ocurred processing message\nError: ${error}\nMessage:${msg || 'n/a'}\n`));
app.on('empty', () => logger.info('Empty queue!\n'));

exports.app = app;
