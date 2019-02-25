'use strict';

const CIO = require('customerio-node');
const inspect = require('util').inspect;

const BlinkRetryError = require('../errors/BlinkRetryError');
const CustomerIoUpdateCustomerMessage = require('../messages/CustomerIoUpdateCustomerMessage');
const logger = require('../../config/logger');
const removePIITransformer = require('../lib/helpers/logger/transformers/remove-pii');
const leanifyTransformer = require('../lib/helpers/logger/transformers/leanify');
const Worker = require('./Worker');

const logTransformers = [
  removePIITransformer,
  leanifyTransformer,
];

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
      logger.info(inspect(data));
      await this.cioClient.identify(id, data);
    } catch (error) {
      // Exposed as info for monitoring
      this.log(
        'info',
        customerIoUpdateCustomerMessage,
        `${inspect(error)}`,
        'error_cio_update_cant_update_consumer',
      );
      throw new BlinkRetryError(
        `Unknown customer.io error: ${error.message}`,
        userMessage,
      );
    }

    this.log(
      // Set as debug since we will monitor on error instead
      'debug',
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
    logger.log(level, `${text}, message ${message.toLog(logTransformers)}`, { meta });
  }
}

module.exports = CustomerIoUpdateCustomerWorker;
