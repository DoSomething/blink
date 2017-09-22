'use strict';

const CIO = require('customerio-node');
const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
const Worker = require('./Worker');

class CustomerIoTrackEventWorker extends Worker {
  constructor(blink) {
    super(blink);
    this.blink = blink;

    this.cioConfig = this.blink.config.customerio;

    // Bind process method to queue context
    this.consume = this.consume.bind(this);

    // Set up client
    this.cioClient = new CIO(this.cioConfig.apiKey, this.cioConfig.siteId);
  }

  async consume(transformableMessage) {
    // Helper variables.
    const msgData = transformableMessage.getData();
    let meta;

    // Convert campaign signup to customer.io event.
    let customerIoEvent;
    try {
      customerIoEvent = transformableMessage.toCustomerIoEvent();
    } catch (error) {
      meta = {
        env: this.blink.config.app.env,
        code: 'error_cio_update_cant_convert_campaign_signup',
        worker: this.constructor.name,
        request_id: transformableMessage.getRequestId(),
      };
      logger.warning(
        `Can't convert signup event to cio event: ${msgData.id} error ${error}`,
        meta,
      );
    }

    try {
      await this.cioClient.track(customerIoEvent.getId(), {
        name: customerIoEvent.getName(),
        data: customerIoEvent.getData(),
      });
    } catch (error) {
      this.log(
        'warning',
        transformableMessage,
        `${error}`,
        `error_cio_track_cant_${this.eventName}`,
      );
      throw new BlinkRetryError(
        `Unexpected customer.io error during cio.track(): ${error}`,
        transformableMessage,
      );
    }

    this.log(
      'debug',
      transformableMessage,
      'Customer.io campaign signup tracked',
      `success_cio_${this.eventName}`,
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

module.exports = CustomerIoTrackEventWorker;
