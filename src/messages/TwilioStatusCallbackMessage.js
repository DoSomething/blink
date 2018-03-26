'use strict';

const Joi = require('joi');

const Message = require('./Message');

/**
 * DEPRECATED
 * TODO: Remove this message class
 */
class TwilioStatusCallbackMessage extends Message {
  constructor(...args) {
    super(...args);

    this.schema = Joi.object()
      // Allow presence of all other keys.
      .unknown();
  }

  isInbound() {
    return this.getData().SmsStatus === 'received';
  }

  isDelivered() {
    return this.getData().MessageStatus === 'delivered';
  }
}

module.exports = TwilioStatusCallbackMessage;
