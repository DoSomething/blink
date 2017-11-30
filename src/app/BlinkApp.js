'use strict';

// ------- Imports -------------------------------------------------------------

const changeCase = require('change-case');
const logger = require('winston');

// ------- Internal imports ----------------------------------------------------

// Blink Libs.
const RabbitMQBroker = require('../lib/brokers/RabbitMQ/RabbitMQBroker');

// Queues.
const CustomerIoCampaignSignupPostQ = require('../queues/CustomerIoCampaignSignupPostQ');
const CustomerIoCampaignSignupQ = require('../queues/CustomerIoCampaignSignupQ');
const CustomerioSmsBroadcastRelayQ = require('../queues/CustomerioSmsBroadcastRelayQ');
const CustomerIoUpdateCustomerQ = require('../queues/CustomerIoUpdateCustomerQ');
const FetchQ = require('../queues/FetchQ');
const GambitCampaignSignupRelayQ = require('../queues/GambitCampaignSignupRelayQ');
const QuasarCustomerIoEmailActivityQ = require('../queues/QuasarCustomerIoEmailActivityQ');
const TwilioSmsBroadcastGambitRelayQ = require('../queues/TwilioSmsBroadcastGambitRelayQ');
const TwilioSmsInboundGambitRelayQ = require('../queues/TwilioSmsInboundGambitRelayQ');

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

  // ------- Static helpers  ---------------------------------------------------

  static discoverQueueClasses() {
    // TODO: register them from workers, bottom-up approach.
    return [
      CustomerIoCampaignSignupPostQ,
      CustomerIoCampaignSignupQ,
      CustomerioSmsBroadcastRelayQ,
      CustomerIoUpdateCustomerQ,
      FetchQ,
      GambitCampaignSignupRelayQ,
      QuasarCustomerIoEmailActivityQ,
      TwilioSmsBroadcastGambitRelayQ,
      TwilioSmsInboundGambitRelayQ,
    ];
  }

  static generateQueueRegistryKey(queueClass) {
    return changeCase.camelCase(queueClass.name);
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = BlinkApp;

// ------- End -----------------------------------------------------------------
