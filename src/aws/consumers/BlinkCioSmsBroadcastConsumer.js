'use strict';

const Consumer = require('sqs-consumer');
const inspect = require('util').inspect;

const logger = require('../../../config/logger');
const { Message } = require('./Message');
const { config } = require('../../../config/consumers/cio-sms-broadcast');
const gambitHelper = require('../../workers/lib/helpers/gambit-conversations');

function logMemUsage() {
  const used = process.memoryUsage();
  Object.keys(used).forEach((key) => {
    logger.info(`${key} ${Math.round(used[key] / 1024 / (1024 * 100)) / 100} MB`);
  });
}

function getPayload(message) {
  return {
    // @see https://github.com/bitinn/node-fetch#post-with-json
    body: message.getBody(), // returns stringified JSON body
  };
}

async function handler(rawMessage) {
  const message = new Message(rawMessage);
  const payload = getPayload(message);
  try {
    await gambitHelper.relayBroadcastMessage(message, payload);
  } catch (error) {
    /**
     * Throwing an error will not delete the message from the queue.
     * TODO: Use exponential backoff to increment the visibility timeout.
     * I read somewhere that the AWS client has this feature already.
     * I have to investigate more.
     */
    throw new Error('failed!');
  }
  logger.info(`Consumed message instance: ${inspect(message)}, raw message: ${inspect(rawMessage)}`); // eslint-disable-line
  // Will help w/ figuring out how much memory a single process needs to use
  logMemUsage();
}
//  Create queue consumer
const app = Consumer.create({
  handleMessage: handler,
  ...config,
});

// Register event handlers
// @see https://www.npmjs.com/package/sqs-consumer#events

app.on('processing_error', (error, msg) => {
  logger.error(`Error ocurred processing message\nError: ${error}\nMessage:${msg || 'n/a'}\n`);
});
app.on('error', (error, msg) => {
  logger.error(`Error ocurred interacting w/ a queue\nError: ${error}\nMessage:${msg || 'n/a'}\n`);
});
app.on('timeout_error', (error, msg) => logger.error(`Timeout error ocurred\nError: ${error}\nMessage:${msg || 'n/a'}\n`));
app.on('empty', () => logger.info('Drained queue!\n'));
app.on('stopped', () => logger.info('Consumer stopped!\n'));

exports.app = app;
