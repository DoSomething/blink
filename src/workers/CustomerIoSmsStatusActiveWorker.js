'use strict';

const GambitConversationsRelayBaseWorker = require('./GambitConversationsRelayBaseWorker');
const gambitHelper = require('../lib/helpers/gambit');

class CustomerIoSmsStatusActiveWorker extends GambitConversationsRelayBaseWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoSmsStatusActiveQ,
    });
  }

  async consume(message) {
    const body = JSON.stringify({
      northstarId: message.getNorthstarId(),
    });

    try {
      const response = await gambitHelper.relaySmsStatusActiveMessage(message, {
        body,
      });
      return this.handleResponse(message, response);
    } catch (error) {
      return this.logUnreachableGambitConversationsAndRetry(error, message);
    }
  }

  static getLogCode(name) {
    const logCodes = {
      retry: 'error_customerio_sms_status_active_gambit_response_not_200_retry',
      success: 'success_customerio_sms_status_active_gambit_response_200',
      suppress: 'success_customerio_sms_status_active_relay_gambit_retry_suppress',
      unprocessable: 'error_customerio_sms_status_active_gambit_response_422',
    };
    return logCodes[name];
  }
}

module.exports = CustomerIoSmsStatusActiveWorker;
