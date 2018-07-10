'use strict';

const GambitConversationsRelayBaseWorker = require('./GambitConversationsRelayBaseWorker');
const gambitHelper = require('../lib/helpers/gambit');


/**
 * TwilioStatusCallbackRelayBaseWorker
 *
 * This class is intended to be extended by the TwilioStatusOutbound*RelayWorker class.
 * Since both the Status and the Error workers use virtually the same consume method.
 * It made sense to abstract that out and let the children setup the small differences.
 */
class TwilioStatusCallbackRelayBaseWorker extends GambitConversationsRelayBaseWorker {
  setup({ queue, getUpdatePayloadFn }) {
    super.setup({ queue });
    // TODO: Throw if no getUpdatePayloadFn is passed
    this.getUpdatePayloadFn = getUpdatePayloadFn;
  }

  async consume(message) {
    let messageId;
    let getMessageResponse;

    try {
      getMessageResponse = await gambitHelper.getMessageToUpdate(message);
    } catch (error) {
      return this.logUnreachableGambitConversationsAndRetry(error, message);
    }
    /**
     * It will return true, false, or it will throw a BlinkRetryError.
     * True - the request is successful and its safe to continue processing.
     * False - the request is not successful and should not be retried.
     * Thrown BlinkRetryError - the request is not successful and should be retried.
     */
    const success = this.handleResponse(message, getMessageResponse);
    /**
     * returning false will ack the message but won't continue processing the other calls below.
     * If the error we get back from G-Conversstions should not be retried then we should Just
     * not process this message and drop it.
     */
    if (!success) {
      return false;
    }

    try {
      messageId = gambitHelper.parseMessageIdFromBody(await getMessageResponse.json());
    } catch (error) {
      return this.logAndRetry(message, 500, error.message);
    }

    const body = JSON.stringify(this.getUpdatePayloadFn(message.getData()));
    /**
     * TODO: It's a more consistent approach to inject the messageId into the message
     * object and send to gambitHelper.updateMessage. This way we would not have to setup the
     * request headers outside of the gambit helper function. This is confusing when other methods
     * in the gambit helper assume they get a message instance, thus are able to get the headers
     * at that level.
     */
    const headers = gambitHelper.getRequestHeaders(message);

    try {
      const updateResponse = await gambitHelper.updateMessage(messageId, {
        headers,
        body,
      });
      return this.handleResponse(message, updateResponse);
    } catch (error) {
      return this.logUnreachableGambitConversationsAndRetry(error, message);
    }
  }
}

module.exports = TwilioStatusCallbackRelayBaseWorker;
