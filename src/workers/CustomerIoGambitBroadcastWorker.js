'use strict';

const GambitConversationsRelayBaseWorker = require('./GambitConversationsRelayBaseWorker');
const gambitHelper = require('./lib/helpers/gambit-conversations');

const logCodes = {
  retry: 'error_customerio_gambit_broadcast_gambit_response_not_200_retry',
  success: 'success_customerio_gambit_broadcast_gambit_response_200',
  suppress: 'success_customerio_gambit_broadcast_relay_gambit_retry_suppress',
  unprocessable: 'error_customerio_gambit_broadcast_gambit_response_422',
};

class CustomerIoGambitBroadcastWorker extends GambitConversationsRelayBaseWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoGambitBroadcastQ,
      rateLimit: this.blink.config.workers.gambitConversations.broadcastSpeedLimit,
    });
  }

  async consume(message) {
    const body = JSON.stringify({
      northstarId: message.getNorthstarId(),
      broadcastId: message.getBroadcastId(),
    });

    try {
      const response = await gambitHelper.relayBroadcastMessage(message, {
        body,
      });
      return this.handleResponse(message, response);
    } catch (error) {
      return this.logUnreachableGambitConversationsAndRetry(error, message);
    }
  }

  static getLogCode(name) {
    return logCodes[name];
  }
}

module.exports = CustomerIoGambitBroadcastWorker;
