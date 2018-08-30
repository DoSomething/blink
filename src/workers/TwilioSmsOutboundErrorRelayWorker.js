'use strict';

const TwilioStatusCallbackRelayBaseWorker = require('./TwilioStatusCallbackRelayBaseWorker');
const gambitHelper = require('./lib/helpers/gambit-conversations');

const logCodes = {
  retry: 'error_gambit_outbound_error_relay_response_not_200_retry',
  success: 'success_gambit_outbound_error_relay_response_200',
  suppress: 'success_gambit_outbound_error_relay_retry_suppress',
  unprocessable: 'error_gambit_outbound_error_relay_response_422',
};

class TwilioSmsOutboundErrorRelayWorker extends TwilioStatusCallbackRelayBaseWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.twilioSmsOutboundErrorRelayQ,
      getUpdatePayloadFn: gambitHelper.getFailedAtUpdateBody,
    });
  }

  static getLogCode(name) {
    return logCodes[name];
  }
}

module.exports = TwilioSmsOutboundErrorRelayWorker;
