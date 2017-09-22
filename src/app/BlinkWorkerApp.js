'use strict';

const BlinkError = require('../errors/BlinkError');
const CustomerIoCampaignSignupWorker = require('../workers/CustomerIoCampaignSignupWorker');
const CustomerIoCampaignSignupPostWorker = require('../workers/CustomerIoCampaignSignupPostWorker');
const CustomerIoUpdateCustomerWorker = require('../workers/CustomerIoUpdateCustomerWorker');
const FetchWorker = require('../workers/FetchWorker');
const GambitChatbotMdataProxyWorker = require('../workers/GambitChatbotMdataProxyWorker');
const GambitMessageDataRelayWorker = require('../workers/GambitMessageDataRelayWorker');
const BlinkApp = require('./BlinkApp');

class BlinkWorkerApp extends BlinkApp {
  constructor(config, name) {
    super(config);

    const workersMapping = BlinkWorkerApp.getAvailableWorkers();
    if (!workersMapping[name]) {
      throw new BlinkError(`Worker ${name} is not found`);
    }
    this.worker = new workersMapping[name](this);
    // TODO: figure out worker names
    this.workerNname = name;
  }

  async reconnect() {
    const success = await super.reconnect();
    if (success) {
      this.worker.setup();
      this.worker.perform();
    }
  }

  static getAvailableWorkers() {
    return {
      fetch: FetchWorker,
      'customer-io-update-customer': CustomerIoUpdateCustomerWorker,
      'customer-io-campaign-signup': CustomerIoCampaignSignupWorker,
      'customer-io-campaign-signup-post': CustomerIoCampaignSignupPostWorker,
      'gambit-chatbot-mdata-proxy': GambitChatbotMdataProxyWorker,
      'gambit-message-data-relay': GambitMessageDataRelayWorker,
    };
  }
}

module.exports = BlinkWorkerApp;
