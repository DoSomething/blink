'use strict';

const TwilioStatusCallbackRelayBaseWorker = require('./TwilioStatusCallbackRelayBaseWorker');
const gambitHelper = require('./lib/helpers/gambit-conversations');

const logCodes = {
  retry: 'error_gambit_outbound_status_relay_response_not_200_retry',
  success: 'success_gambit_outbound_status_relay_response_200',
  suppress: 'success_gambit_outbound_status_relay_retry_suppress',
  unprocessable: 'error_gambit_outbound_status_relay_response_422',
};

class TwilioSmsOutboundStatusRelayWorker extends TwilioStatusCallbackRelayBaseWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.twilioSmsOutboundStatusRelayQ,
      getUpdatePayloadFn: gambitHelper.getDeliveredAtUpdateBody,
    });
  }

  static getLogCode(name) {
    return logCodes[name];
  }
}

module.exports = TwilioSmsOutboundStatusRelayWorker;
