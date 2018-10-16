'use strict';

const CIO = require('customerio-node');

const BlinkRetryError = require('../errors/BlinkRetryError');
const CustomerIoUpdateCustomerMessage = require('../messages/CustomerIoUpdateCustomerMessage');
const logger = require('../../config/logger');
const removePIITransformer = require('../lib/helpers/logger/transformers/remove-pii');
const Worker = require('./Worker');

class CustomerIoUpdateCustomerWorker extends Worker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoUpdateCustomerQ,
    });
    // Setup customer.io client.
    this.cioConfig = this.blink.config.customerio;
    this.cioClient = new CIO(this.cioConfig.apiKey, this.cioConfig.siteId);
  }

  async consume(userMessage) {
    let meta;
    let customerIoUpdateCustomerMessage;
    try {
      customerIoUpdateCustomerMessage = CustomerIoUpdateCustomerMessage.fromUser(userMessage);
    } catch (error) {
      meta = {
        env: this.blink.config.app.env,
        code: 'error_cio_update_cant_convert_user',
        worker: this.constructor.name,
        request_id: userMessage ? userMessage.getRequestId() : 'not_parsed',
      };
      logger.warning(
        `Can't convert user to cio customer: ${userMessage.getData().id} error ${error}`,
        { meta },
      );
    }

    const { id, data } = customerIoUpdateCustomerMessage.getData();

    try {
      await this.cioClient.identify(id, data);
    } catch (error) {
      this.log(
        'warning',
        customerIoUpdateCustomerMessage,
        `${error}`,
        'error_cio_update_cant_update_consumer',
      );
      throw new BlinkRetryError(
        `Unknown customer.io error: ${error}`,
        userMessage,
      );
    }

    this.log(
      // exposed as info for monitoring
      'info',
      customerIoUpdateCustomerMessage,
      'Customer.io updated',
      'success_cio_consumer_updated',
    );

    return true;
  }

  log(level, message, text, code = 'unexpected_code') {
    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.constructor.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
    };
    // Todo: log error?
    logger.log(level, `${text}, message ${message.toString(removePIITransformer)}`, { meta });
  }
}

module.exports = CustomerIoUpdateCustomerWorker;
