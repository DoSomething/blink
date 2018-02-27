'use strict';

const CIO = require('customerio-node');
const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
const Worker = require('./Worker');

class CustomerIoTrackEventWorker extends Worker {
  setup({ queue, eventName }) {
    super.setup({ queue });
    /**
     * Worker event name for internal tracking (logging), example:
     * track_campaign_signup, track_campaign_signup_post, etc.
     * Not to be confused with the eventName property found in some Message classes like
     * CampaignSignupPostReviewMessage, which is the eventName used in C.io.
     *
     * TODO: This is somewhat confusing. We should use the CustomerIoEvent's eventName property.
     */
    this.eventName = eventName;
    // Setup customer.io client.
    this.cioConfig = this.blink.config.customerio;
    this.cioClient = new CIO(this.cioConfig.apiKey, this.cioConfig.siteId);
  }

  async consume(transformableMessage) {
    // Helper variables.
    const msgData = transformableMessage.getData();
    let meta;

    // Convert message to customer.io event.
    let customerIoEvent;
    try {
      customerIoEvent = transformableMessage.toCustomerIoEvent();
    } catch (error) {
      meta = {
        env: this.blink.config.app.env,
        code: 'error_cant_convert_message_to_cio_event',
        worker: this.constructor.name,
        request_id: transformableMessage.getRequestId(),
      };
      logger.warning(
        `Can't convert message to cio event: ${msgData.id} error ${error}`,
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
      'Customer.io event tracked',
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
