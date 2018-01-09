'use strict';

// ------- Imports -------------------------------------------------------------

const logger = require('winston');

// ------- Internal imports ----------------------------------------------------

const Broker = require('../Broker');
const DelayLogic = require('../../delayers/DelayLogic');
const ReconnectManager = require('../../ReconnectManager');
const RabbitMQConnectionManager = require('./RabbitMQConnectionManager');

// ------- Class ---------------------------------------------------------------

class RabbitMQBroker extends Broker {
  constructor({ connection = {}, settings = {} }, clientDescription = false) {
    super();

    // Initialize reconnect manager suitable for RabbitMQ.
    // Anecdotally, Constant time backoff every 2 seconds works best.
    // TODO: confirm if that's true.
    const reconnectManager = new ReconnectManager(
      DelayLogic.constantTimeDelay(2000),
    );

    // TODO: use options array instead of clientDescription.
    this.connectionManager = new RabbitMQConnectionManager(
      connection,
      clientDescription,
      reconnectManager,
    );

    // RabbitMQ exchange used for standard interfacing with queues.
    this.topicExchange = settings.topicExchange;

    // Supported priorities.
    this.priorities = new Map();
    // Process after all other messages are done.
    this.priorities.set('LOW', 0);
    // Normal messages.
    this.priorities.set('STANDARD', 1);
    // Skip the line pass: put messages directly to the front of the queue.
    this.priorities.set('HIGH', 2);
  }

  // ------- Public API  -------------------------------------------------------

  /**
   * Create managed RabbitMQ connection
   */
  async connect() {
    // Create managed RabbitMQ connection.
    const connectionResult = await this.connectionManager.connect();
    if (!connectionResult) {
      return false;
    }

    // To perform normal operations, RabbitMQ needs exchanges.
    // Without them, we're as good, as disconnected, so treat
    // their assertion as a step of connecting to RabbitMQ.
    // May make sense to move this to Broker.setup() if there are more
    // use-cases for this in other broker implementations.
    const exchangesAreReady = await this.assertExchanges();
    if (!exchangesAreReady) {
      return false;
    }

    // Everything's ready.
    return true;
  }

  async disconnect() {
    await this.connectionManager.disconnect();
  }

  // ------- Broker interface methods implementation  --------------------------

  /**
   * Publish to queues using RabbitMQ topic exchange routing rules
   *
   * Note: this works out of box only with topic exchanges and only in RabbitMQ.
   * In other brokers, we may need to compensate for lack of this
   * functionality using own routing system.
   * As an alternative, we may need to shift to direct exchanges only.
   *
   * @param  {string} route      Routing key
   * @param  {object} message    Message
   * @param  {string} priority   Set message priority to one of the following:
   *                             STANDARD, LOW, HIGH, Defaults to STANDARD.
   *                             Make sure to use uppercase.
   * @return {undefined}         This method is RPC and does not have server response
   */
  publishToRoute(route, message, priority = 'STANDARD') {
    // Will return undefined if requested priority is unknown.
    let priorityId = this.priorities.get(priority);
    // We explicitly check for undefined to allow 0 as a valid value.
    if (priorityId === undefined) {
      // All messages will be published with standard priority: 1.
      priorityId = this.priorities.get('STANDARD');
    }

    // Explicitly define desired options.
    const options = {
      // The message will be returned if it is not routed to a queue.
      mandatory: true,
      // Always persistent.
      persistent: true,
      // Priority.
      // See http://www.rabbitmq.com/priority.html
      priority: priorityId,
    };


    // Todo: save additional message metadata?
    // TODO: handle drain and returned messages.
    // @see http://www.squaremobius.net/amqp.node/channel_api.html#channel-events
    this.getChannel().publish(
      this.topicExchange,
      route,
      new Buffer(message.toString(), 'utf-8'),
      options,
    );
  }

  /**
   * Subscribe callback for new messages in the queue with provided name
   *
   * @param  {string}   queueName    The queue name
   * @param  {Function} callback     The listener for new messages
   * @param  {string}   consumerTag  Optional consumer tag
   * @return {string}                Registered consumer tag
   */
  async subscribe(queueName, callback, consumerTag = false) {
    // Explicitly define desired options.
    const options = {
      // Acknowledge mode.
      noAck: false,
      // Allow multiple consumers to listen from same queue.
      exclusive: false,
      // noLocal option is not implemented by RabbitMQ and not needed.
      // priority option is not needed.
    };
    // Todo: handle consumerTag automatically?.
    if (consumerTag) {
      // When omitted, RabbitMQ generates semi-random consumer name.
      options.consumerTag = consumerTag;
    }
    const response = await this.getChannel().consume(queueName, callback, options);
    // Todo: handle errors? return true/false?
    return response.consumerTag;
  }

  /**
   * Acknowledge message
   *
   * Note: This method works with the value of message.fields.deliveryTag.
   * @see https://github.com/squaremo/amqp.node/blob/master/lib/channel_model.js#L221
   *
   * @param  {object} message The messgage to acknowledge
   * @return {undefined}      This method is RPC and does not have server response
   */
  ack(message) {
    this.getChannel().ack(message);
  }

  /**
   * Negative acknowledge message
   *
   * Note: This method works with the value of message.fields.deliveryTag.
   * @see https://github.com/squaremo/amqp.node/blob/master/lib/channel_model.js#L231
   *
   * @param  {object} message The messgage to acknowledge negativly
   * @return {undefined}      This method is RPC and does not have server response
   */
  nack(message) {
    this.getChannel().reject(message, false);
  }

  /**
   * Creates queue and bounds it to routes.
   *
   * 1. Creates main queue with the name provided
   * 2. Binds it to the topic exchange on provided routes
   * 3. TODO: create additional support queueus
   *
   * @param  {string} queueName    Queue name
   * @param  {array}  queueRoutes  The list of routes, see publishToRoute()
   * @return {bool}                Whether all operations were successful
   */
  async createQueue(queueName, queueRoutes) {
    // 1. Create main queue.
    const mainQueueCreated = await this.assertQueue(queueName);
    if (!mainQueueCreated) {
      return false;
    }

    // 2. Bind main queue to topic exchange.
    const mainQueueBinds = queueRoutes.map(
      async route => this.bindQueue(queueName, this.topicExchange, route),
    );
    // Execute binds promise.
    const mainQueueBound = await Promise.all(mainQueueBinds);
    // Ensure all promises are resolved to true.
    if (!mainQueueBound.every(result => result)) {
      return false;
    }

    logger.info(`Queue ${queueName} is ready.`, {
      code: 'success_rabbitmq_broker_create_queue_topic',
    });

    // TODO: create technical queues: retry and dead-letters.
    return true;
  }

  /**
   * Purge the queue.
   *
   * Note that this won’t remove messages that have been delivered
   * but not yet acknowledged.
   *
   * @return {Number} The number of messages purged from the queue
   */
  async purgeQueue(queueName) {
    let result;
    try {
      result = await this.getChannel().purgeQueue(queueName);
    } catch (error) {
      // TODO: log error instead?
      throw new Error(`Failed to purge queue "${queueName}": ${error.message}`);
    }
    return result.messageCount;
  }

  /**
   * Deletes the queue.
   *
   * @return {Number} The number of messages deleted or dead-lettered along with the queue
   */
  async deleteQueue(queueName) {
    let result;
    try {
      result = await this.getChannel().deleteQueue(queueName, {
        // If true and the queue has consumers,
        // it will not be deleted and the channel will be closed.
        ifUnused: false,
        // if true and the queue contains messages,
        // the queue will not be deleted and the channel will be closed.
        ifEmpty: false,
      });
    } catch (error) {
      // TODO: handle broker closing on unsuccessful delete?
      // TODO: log error instead?
      throw new Error(`Failed to delete queue "${queueName}": ${error.message}`);
    }
    return result.messageCount;
  }

  // ------- RabbitMQ specific methods and mechanisms --------------------------

  async assertExchanges() {
    // Assert topic exchange for standard interactions.
    // We need all of them, so fail if any of these operations aren't successful.
    try {
      await this.getChannel().assertExchange(this.topicExchange, 'topic');
      logger.info(`Topic exchange ${this.topicExchange} asserted`, {
        code: 'success_rabbitmq_broker_topic_assert_exchange',
      });
      // TODO: create other exchanges.
      return true;
    } catch (error) {
      logger.error(`Couldn't assert neccessary exchanges: ${error}`, {
        code: 'error_rabbitmq_broker_assert_exchange_failed',
      });
    }
    return false;
  }

  async assertQueue(queueName) {
    // Explicitly define desired options.
    // See https://www.rabbitmq.com/queues.html
    // See http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
    const options = {
      // This option allows only one connection to the queue.
      // The queue will be deleted when that connection closes.
      // We don't need that.
      exclusive: false,
      // The queue will survive a broker restart. Yes!
      durable: true,
      // The queue will be deleted when last consumer unsubscribes.
      // Nope.
      autoDelete: false,
      // See http://www.rabbitmq.com/priority.html
      // Define 3 priority levels: HIGH, LOW, MEDIUM.
      // This is a RabbitMQ specific feature. Normally, it's declared through
      // the `arguments` object (see below), but amqplib exposes this feature
      // through an option called `maxPriority`.
      // It'll be transformed to `x-max-priority` argument.
      maxPriority: 2, // Amounts to 3 levels: 0, 1, 2.
      // Used by plugins and broker-specific features.
      arguments: {},
    };

    try {
      await this.getChannel().assertQueue(queueName, options);
    } catch (error) {
      // Will throw an exception when queue exists with the same name,
      // but different settings.
      logger.error(`Error asserting queue ${queueName}: ${error}`, {
        code: 'error_rabbitmq_broker_assert_queue_failed',
      });
      return false;
    }

    logger.debug(`Queue ${queueName} created or already present in expected state`, {
      code: 'success_rabbitmq_broker_assert_queue',
    });
    return true;
  }

  async bindQueue(queueName, exhangeName, route) {
    try {
      await this.getChannel().bindQueue(queueName, exhangeName, route);
    } catch (error) {
      // Should never happen, but log this, just in case.
      // @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_bindQueue
      logger.error(`Error binding queue ${queueName} to ${exhangeName} on ${route}: ${error}`, {
        code: 'error_rabbitmq_broker_bind_queue_unexpected',
      });
      return false;
    }

    logger.debug(`Queue ${queueName} bound to ${exhangeName} on ${route}`, {
      code: 'success_rabbitmq_broker_bind_queue',
    });
    return true;
  }

  getChannel() {
    // Todo: investigate possibility of replacing this with a
    // compatible fake when channel is not available to
    // queue requests and feed them to an active channel
    // when it's recovered.
    return this.connectionManager.getActiveChannel();
  }

  isConnected() {
    return this.connectionManager.connected;
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = RabbitMQBroker;

// ------- End -----------------------------------------------------------------
