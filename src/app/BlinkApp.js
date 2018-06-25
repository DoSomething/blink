'use strict';

// ------- Imports -------------------------------------------------------------

const changeCase = require('change-case');
const logger = require('winston');

// ------- Internal imports ----------------------------------------------------

// Blink Libs.
const RabbitMQBroker = require('../lib/brokers/RabbitMQ/RabbitMQBroker');
const RedisConnectionManager = require('../lib/RedisConnectionManager');

// Queues.
const CustomerIoCampaignSignupPostQ = require('../queues/CustomerIoCampaignSignupPostQ');
const CustomerIoCampaignSignupPostReviewQ = require('../queues/CustomerIoCampaignSignupPostReviewQ');
const CustomerIoCampaignSignupQ = require('../queues/CustomerIoCampaignSignupQ');
const CustomerioGambitBroadcastQ = require('../queues/CustomerioGambitBroadcastQ');
const CustomerIoUpdateCustomerQ = require('../queues/CustomerIoUpdateCustomerQ');
const FetchQ = require('../queues/FetchQ');
const GambitCampaignSignupRelayQ = require('../queues/GambitCampaignSignupRelayQ');
const QuasarCustomerIoEmailActivityQ = require('../queues/QuasarCustomerIoEmailActivityQ');
const TwilioSmsInboundGambitRelayQ = require('../queues/TwilioSmsInboundGambitRelayQ');
const TwilioSmsOutboundErrorRelayQ = require('../queues/TwilioSmsOutboundErrorRelayQ');
const TwilioSmsOutboundStatusRelayQ = require('../queues/TwilioSmsOutboundStatusRelayQ');

// ------- Class ---------------------------------------------------------------

class BlinkApp {
  constructor(config) {
    this.config = config;
    this.queues = [];
    this.broker = false;

    // Attach Public API functions to object context.
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
  }

  // ------- Public API  -------------------------------------------------------

  async start() {
    // Setup connection to message broker server.
    this.broker = await this.setupBroker();

    // Setup connection to redis.
    this.redis = await this.setupRedis();

    // Assert queues and add them to queue registry.
    // IMPORTANT: if the broker goes away and returns with no queues,
    // we will be able to recover the connection automatically,
    // but queues will not be created.
    // Full topology is only asserted on app bootstrap.
    this.queues = await this.setupQueues(BlinkApp.discoverQueueClasses());

    // Log success.
    logger.info('Blink app is loaded.', { code: 'success_blink_app_loaded' });

    // TODO: Error handling?
    return true;
  }

  async stop() {
    // TODO: log.
    // Flush queues.
    this.queues = [];
    await this.broker.disconnect();
    await this.redis.disconnect();
    return true;
  }

  // ------- Internal machinery  -----------------------------------------------

  async setupBroker() {
    // Optional: tag connection for easier debug.
    const clientDescription = {
      // TODO: add dyno name.
      name: this.config.app.name,
      version: this.config.app.version,
      env: this.config.app.env,
    };

    // Now only RabbitMQ is supported.
    const broker = new RabbitMQBroker(this.config.amqp, clientDescription);
    // Establish connection or perform authorization.
    const result = await broker.connect();
    if (!result) {
      // Do what?
    }
    // Return connected broker.
    return broker;
  }

  async setupRedis() {
    // Now only RabbitMQ is supported.
    const redis = new RedisConnectionManager(this.config.redis);
    // Establish connection or perform authorization.
    const result = await redis.connect();
    if (!result) {
      // TODO: Handle case when redis doesn't connect.
    }
    // Return connected redis.
    return redis;
  }

  async setupQueues(queueClasses) {
    // TODO: This is too confusing. KISS.
    const queueMappingPromises = queueClasses.map(async (queueClass, i) => {
      // It's not possible to just say `new queueClass()`, JS would think
      // we're trying to construct class called 'queueClass'.
      // To construct a class dynamically, it's possible `new` its reference
      // stored as an array element: `new queueClasses[i]`.
      const queue = new queueClasses[i](this.broker);
      // Ensure the queue is present with exptected settings.
      // Todo: parse result.
      await queue.create();
      // Registry key makes it more convenient to get queues from the
      // registry using Node's object destructing:
      // const { fetchQ } = this.blink.queues;
      const registryKey = BlinkApp.generateQueueRegistryKey(queueClass);
      // Return an item of 2D array for further transformation.
      return [registryKey, queue];
    });

    // Wait for all queues to be asserted.
    const queueRegistryArray = await Promise.all(queueMappingPromises);

    // Transform resolved promises array to an object.
    // TODO: Again, too confusing, KISS.
    const queueRegistry = {};
    queueRegistryArray.forEach((mapping) => {
      const [key, value] = mapping;
      queueRegistry[key] = value;
    });
    return queueRegistry;
  }

  /**
   * Returns a queue with a given name from queue registry.
   *
   * This method perform search on all queues.
   * It shouldn't be used in most cases, you can get the queue
   * from the registry by its mapping key, example
   *
   * ```
   * const { fetchQ } = blink.queues;
   * ```
   * @param  {strin} name The name of the queue to search
   * @return {Queue|undefined} The queue found or undefined
   */
  getQueueByName(name) {
    return Object.values(this.queues).find(queue => queue.name === name);
  }

  // ------- Static helpers  ---------------------------------------------------

  static discoverQueueClasses() {
    // TODO: register them from workers, bottom-up approach.
    return [
      CustomerIoCampaignSignupPostQ,
      CustomerIoCampaignSignupPostReviewQ,
      CustomerIoCampaignSignupQ,
      CustomerioGambitBroadcastQ,
      CustomerIoUpdateCustomerQ,
      FetchQ,
      GambitCampaignSignupRelayQ,
      QuasarCustomerIoEmailActivityQ,
      TwilioSmsInboundGambitRelayQ,
      TwilioSmsOutboundErrorRelayQ,
      TwilioSmsOutboundStatusRelayQ,
    ];
  }

  static generateQueueRegistryKey(queueClass) {
    return this.getQueueRegistryKey(queueClass.name);
  }

  static getQueueRegistryKey(queueName) {
    return changeCase.camelCase(queueName);
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = BlinkApp;

// ------- End -----------------------------------------------------------------
