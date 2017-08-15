'use strict';

const changeCase = require('change-case');
const logger = require('winston');

const Exchange = require('../lib/Exchange');

const CustomerIoUpdateCustomerQ = require('../queues/CustomerIoUpdateCustomerQ');
const FetchQ = require('../queues/FetchQ');
const GambitChatbotMdataQ = require('../queues/GambitChatbotMdataQ');
const MocoMessageDataQ = require('../queues/MocoMessageDataQ');
const QuasarCustomerIoEmailActivityQ = require('../queues/QuasarCustomerIoEmailActivityQ');
const UserSignupPostEventQ = require('../queues/UserSignupPostEventQ');
const UserSignupEventQ = require('../queues/UserSignupEventQ');

class BlinkApp {
  constructor(config) {
    this.config = config;
    this.exchange = false;
    this.queues = [];
    this.connected = false;
    this.connecting = false;
    this.shuttingDown = false;
    this.reconnectTimeout = 2000;

    // Attach functions to object context.
    this.start = this.start.bind(this);
    this.reconnect = this.reconnect.bind(this);
  }

  async start() {
    return this.reconnect();
  }

  async reconnect() {
    if (this.connected || this.connecting) {
      return false;
    }

    // Block other attempts to reconnect when in progress.
    this.connecting = true;
    try {
      // Initialize and setup exchange.
      this.exchange = await this.setupExchange();

      // Initialize and setup all available queues.
      this.queues = await this.setupQueues([
        CustomerIoUpdateCustomerQ,
        FetchQ,
        GambitChatbotMdataQ,
        MocoMessageDataQ,
        QuasarCustomerIoEmailActivityQ,
        UserSignupPostEventQ,
        UserSignupEventQ,
      ]);
    } catch (error) {
      this.connecting = false;
      this.scheduleReconnect(
        this.reconnectTimeout,
        'blink_bootstrap_error',
        `Blink bootrstrap failed: ${error}`,
      );
      return false;
    }

    this.connecting = false;
    this.connected = true;
    return true;
  }

  async stop() {
    // TODO: log.
    this.queues = [];
    this.shuttingDown = true;
    this.exchange.channel.close();
    this.exchange.connection.close();
    this.exchange = false;
    return true;
  }

  async setupExchange() {
    const exchange = new Exchange(this.config);
    await exchange.setup();

    const socket = exchange.channel.connection.stream;
    let meta;
    meta = {
      env: this.config.app.env,
      code: 'amqp_connected',
      amqp_local: `${socket.localAddress}:${socket.localPort}`,
      amqp_remote: `${socket.remoteAddress}:${socket.remotePort}`,
    };
    logger.debug('AMQP connection established', meta);

    exchange.channel.on('error', (error) => {
      meta = {
        env: this.config.app.env,
        code: 'amqp_channel_error',
      };
      logger.warning(error.toString(), meta);
    });

    exchange.connection.on('error', (error) => {
      meta = {
        env: this.config.app.env,
        code: 'amqp_connection_error',
      };
      logger.warning(error.toString(), meta);
    });

    exchange.channel.on('close', () => {
      this.scheduleReconnect(
        0,
        'amqp_channel_closed_from_server',
        'Unexpected AMQP client shutdown',
      );
    });

    exchange.connection.on('close', () => {
      this.scheduleReconnect(
        this.reconnectTimeout,
        'amqp_connection_closed_from_server',
        'Unexpected AMQP connection shutdown',
      );
    });

    return exchange;
  }

  scheduleReconnect(timeout = 0, code, message) {
    // Don't reconnect on programmatic shutdown.
    if (this.shuttingDown) {
      return;
    }
    const meta = {
      env: this.config.app.env,
      code,
    };
    logger.error(`${message}, reconnecting in ${timeout}ms`, meta);
    this.connected = false;
    setTimeout(this.reconnect, timeout);
  }

  async setupQueues(queueClasses) {
    const queueMappingPromises = queueClasses.map(async (queueClass, i) => {
      const queue = new queueClasses[i](this.exchange);
      // Assert Rabbit Topology.
      await queue.setup();
      const mappingKey = changeCase.camelCase(queueClass.name);
      // Return an item of 2D array for further transformation.
      return [mappingKey, queue];
    });

    // Wait for all queues to be set.
    const queueMappingArray = await Promise.all(queueMappingPromises);

    // Transform resolved promises array to an object.
    const queueMapping = {};
    queueMappingArray.forEach((mapping) => {
      const [key, value] = mapping;
      queueMapping[key] = value;
    });
    return queueMapping;
  }
}

module.exports = BlinkApp;
