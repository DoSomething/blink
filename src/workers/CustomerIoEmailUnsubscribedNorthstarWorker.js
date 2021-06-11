'use strict';

const NorthstarRelayBaseWorker = require('./NorthstarRelayBaseWorker');
const northstarHelper = require('./lib/helpers/northstar');

const logCodes = {
  retry: 'error_customerio_email_unsubscribed_northstar_response_not_200_retry',
  success: 'success_customerio_email_unsubscribed_northstar_response_200',
  suppress: 'success_customerio_email_unsubscribed_northstar_retry_suppress',
  unprocessable: 'error_customerio_email_unsubscribed_northstar_response_422',
};

class CustomerIoEmailUnsubscribedNorthstarWorker extends NorthstarRelayBaseWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.quasarCustomerIoEmailUnsubscribedQ,
      rateLimit: this.blink.config.workers.northstar.userUpdateSpeedLimit,
    });
    this.emailUnsubscribedProperty = this.blink.config.workers.northstar.emailUnsubscribed.property;
    this.emailUnsubscribedValue = this.blink.config.workers.northstar.emailUnsubscribed.value;
  }

  async consume(message) {
    const userId = message.getUserId();

    const body = {
      [this.emailUnsubscribedProperty]: this.emailUnsubscribedValue,
    };
    const headers = await northstarHelper.getRequestHeaders(message);

    // If we're missing a `customer_id` on the incoming message, that means
    // means that this user has been deleted from Customer.io & thus we don't
    // need to forward this event on to Northstar (and, without an ID, couldn't!)
    if (!userId) {
      return this.logSuppressedRetry(message, 200, 'skipping due to missing customer_id');
    }

    try {
      const response = await northstarHelper.updateUserById(userId, {
        headers,
        body: JSON.stringify(body),
      });
      return this.handleResponse(message, response);
    } catch (error) {
      return this.logUnreachableNorthstarAndRetry(error, message);
    }
  }

  static getLogCode(name) {
    return logCodes[name];
  }
}

module.exports = CustomerIoEmailUnsubscribedNorthstarWorker;
