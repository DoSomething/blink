'use strict';

const CIO = require('customerio-node');
const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
const CustomerIoUpdateCustomerMessage = require('../messages/CustomerIoUpdateCustomerMessage');
const Worker = require('./Worker');

class CustomerIoUpdateCustomerWorker extends Worker {
  constructor(blink) {
    super(blink);
    this.blink = blink;

    this.cioConfig = this.blink.config.customerio;

    // Bind process method to queue context
    this.consume = this.consume.bind(this);
  }

  setup() {
    this.queue = this.blink.queues.customerIoUpdateCustomerQ;
    this.cioClient = new CIO(this.cioConfig.apiKey, this.cioConfig.siteId);
  }

  async consume(userMessage) {
    let meta;
    let customerIoUpdateCustomerMessage;
    try {
      customerIoUpdateCustomerMessage = CustomerIoUpdateCustomerMessage.fromUser(userMessage);
      customerIoUpdateCustomerMessage.validateStrict();
    } catch (error) {
      meta = {
        env: this.blink.config.app.env,
        code: 'error_cio_update_cant_convert_user',
        worker: this.constructor.name,
        request_id: userMessage ? userMessage.getRequestId() : 'not_parsed',
      };
      logger.warning(
        `Can't convert user to cio customer: ${userMessage.getData().id} error ${error}`,
        meta,
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
      'debug',
      customerIoUpdateCustomerMessage,
      'Customer.io updated',
      'success_cio_consumer_updated',
    );

    return true;
  }

  async log(level, message, text, code = 'unexpected_code') {
    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.constructor.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
    };
    // Todo: log error?
    logger.log(level, `${text}, message ${message.toString()}`, meta);
  }
}

module.exports = CustomerIoUpdateCustomerWorker;
