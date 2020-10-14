'use strict';

const BlinkError = require('../errors/BlinkError');
const CustomerIoGambitBroadcastWorker = require('../workers/CustomerIoGambitBroadcastWorker');
const CustomerIoSmsStatusActiveWorker = require('../workers/CustomerIoSmsStatusActiveWorker');
const CustomerIoEmailUnsubscribedNorthstarWorker = require('../workers/CustomerIoEmailUnsubscribedNorthstarWorker');
const TwilioSmsInboundGambitRelayWorker = require('../workers/TwilioSmsInboundGambitRelayWorker');
const TwilioSmsOutboundStatusRelayWorker = require('../workers/TwilioSmsOutboundStatusRelayWorker');
const TwilioSmsOutboundErrorRelayWorker = require('../workers/TwilioSmsOutboundErrorRelayWorker');
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
    this.workerName = name;
  }

  async start() {
    const success = await super.start();
    if (success) {
      this.worker.setup();
      await this.worker.start();
    }
  }

  // @todo: graceful worker shutdown
  // async stop() {
  //   await this.worker.gracefulStop();
  //   return await super.reconnect();
  // }

  static getAvailableWorkers() {
    return {
      'customer-io-gambit-broadcast': CustomerIoGambitBroadcastWorker,
      'customer-io-sms-status-active': CustomerIoSmsStatusActiveWorker,
      'customer-io-email-unsubscribed-northstar': CustomerIoEmailUnsubscribedNorthstarWorker,
      'twilio-sms-inbound-gambit-relay': TwilioSmsInboundGambitRelayWorker,
      'twilio-sms-outbound-status-relay': TwilioSmsOutboundStatusRelayWorker,
      'twilio-sms-outbound-error-relay': TwilioSmsOutboundErrorRelayWorker,
    };
  }
}

module.exports = BlinkWorkerApp;
