'use strict';

const GambitConversationsRelayWorker = require('./GambitConversationsRelayWorker');
const gambitHelper = require('../lib/helpers/gambit');

class TwilioSmsOutboundErrorRelayWorker extends GambitConversationsRelayWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.twilioSmsOutboundErrorRelayQ,
    });
    this.logCodes = {
      retry: 'error_gambit_outbound_error_relay_response_not_200_retry',
      success: 'success_gambit_outbound_error_relay_response_200',
      suppress: 'success_gambit_outbound_error_relay_retry_suppress',
      unprocessable: 'error_gambit_outbound_error_relay_response_422',
    };
  }

  async consume(message) {
    let messageId;
    const getMessageResponse = await gambitHelper.getMessageToUpdate(message);
    this.handleResponse(message, getMessageResponse);

    try {
      messageId = gambitHelper.parseMessageIdFromBody(await getMessageResponse.json());
    } catch (error) {
      this.logAndRetry(message, 500, error.message);
    }

    const body = JSON.stringify(gambitHelper.getFailedAtUpdateBody(message.getData()));
    const headers = gambitHelper.getRequestHeaders(message);
    const updateResponse = await gambitHelper.updateMessage(messageId, {
      headers,
      body,
    });
    return this.handleResponse(message, updateResponse);
  }
}

module.exports = TwilioSmsOutboundErrorRelayWorker;
