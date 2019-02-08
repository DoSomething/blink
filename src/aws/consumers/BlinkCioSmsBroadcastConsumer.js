'use strict';

const Consumer = require('sqs-consumer');
const inspect = require('util').inspect;

const logger = require('../../../config/logger');
const { Message } = require('./lib/Message');
const utilHelper = require('./lib/util');
const { config } = require('../../../config/consumers/cio-sms-broadcast');
const gambitHelper = require('../../workers/lib/helpers/gambit-conversations');

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
  // TODO: These logs should be compatible with what is being monitored in papertrail
  logger.info(`Consumed message instance: ${inspect(message)}, raw message: ${inspect(rawMessage)}`); // eslint-disable-line
  // Will help w/ figuring out how much memory a single process needs to use
  utilHelper.logMemUsage();
}
//  Create queue consumer
const app = Consumer.create({
  handleMessage: handler,
  ...config.handler,
});

function start() {
  logger.info(`Starting new consumer w/ pid: ${process.pid}`);
  app.start();
}

// Register event handlers
// @see https://www.npmjs.com/package/sqs-consumer#events

app.on('processing_error', (error, msg) => {
  logger.error(`Error ocurred processing message\nError: ${error}\nMessage:${msg || 'n/a'}\n`);
});
app.on('error', (error, msg) => {
  logger.error(`Error ocurred interacting w/ a queue\nError: ${error}\nMessage:${msg || 'n/a'}\n`);
});
app.on('timeout_error', (error, msg) => logger.error(`Timeout error ocurred\nError: ${error}\nMessage:${msg || 'n/a'}\n`));
app.on('empty', () => logger.debug('Drained queue!\n'));
app.on('stopped', () => logger.info('Consumer stopped!\n'));

module.exports = {
  concurrency: config.concurrency,
  start,
};