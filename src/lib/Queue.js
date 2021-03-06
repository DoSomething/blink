'use strict';

const changeCase = require('change-case');

const Dequeuer = require('./Dequeuer');
const RetryManager = require('./RetryManager');

class Queue {
  constructor(broker, name = false) {
    this.broker = broker;

    if (!name) {
      // If name is not explicitly set, generate Queue name from class name:
      // - Removes conventional Q at the end
      // - Parameterizes the string
      // For example, RemoteHttpRequestQ will become remote-http-request.
      this.name = changeCase.paramCase(this.constructor.name.replace(/Q$/, ''));
    } else {
      this.name = name;
    }

    // Define route keys.
    this.routes = [];
    // Automatically create direct route to the queue using its name.
    this.routes.push(this.name);
  }

  /**
   * Send a single message to the queue bypassing routing.
   */
  publish(message, priority = 'STANDARD') {
    // By convention, queues are mapped to their names.
    // @see Queue.constructor().
    this.broker.publishToRoute(this.name, message, priority);
  }

  /**
   * Listen for new messages in this queue, unpack them and send to the callback
   *
   * 1. Receive new message
   * 2. Dequeue it
   * 3. Unpack it to an instance of Message class
   * 4. Validate it
   * 5. Rate limit it
   * 6. Send it as the first argument to callback
   * 7. Process callback result: ack it, nack it, or retry it
   *
   * Work in progress.
   * TODO:
   *  - simplify injecting of Dequeuer, Retry manager
   *  - simplify installing rate limiter
   *  - make message unpack independent from Queue.messageClass
   *    @see  Dequeuer.unpack()
   *
   * @param  {Function} callback     The function to send messages to
   * @param  {object}   options      Options:
   *                                 - retryManager: class to manage retries
   *                                 - rateLimit: integer, defaults to 100
   *                                 - consumerTag: string, set explicit consumer tag
   * @return {string}                Registered consumer tag
   */
  async subscribe(callback, options) {
    let { rateLimit, retryManager, consumerTag } = options;

    if (!retryManager) {
      retryManager = new RetryManager(this);
    }
    if (!rateLimit) {
      rateLimit = 100;
    }
    // If falsy, set to undefined so it will be auto generated.
    if (!consumerTag) {
      consumerTag = undefined;
    }

    const dequeuer = new Dequeuer(this, callback, retryManager, rateLimit);
    this.dequeuer = dequeuer;
    return this.broker.subscribe(this.name, dequeuer.dequeue, consumerTag);
  }

  /**
   * Proxy method to broker.ack()
   */
  ack(message) {
    this.broker.ack(message);
  }

  /**
   * Proxy method to broker.nack()
   */
  nack(message) {
    this.broker.nack(message);
  }

  /**
   * Asserts the queue into existence
   *
   * @return {bool} Result
   */
  async create() {
    return this.broker.createQueue(this.name, this.routes);
  }

  /**
   * Convenience proxy method to broker.purgeQueue()
   */
  async purge() {
    return this.broker.purgeQueue(this.name);
  }

  /**
   * Convenience proxy method to broker.deleteQueue()
   */
  async delete() {
    return this.broker.deleteQueue(this.name);
  }
}

module.exports = Queue;
