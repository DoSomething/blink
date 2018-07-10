'use strict';

const Joi = require('joi');

const Message = require('./Message');

class CustomerIoGambitBroadcastMessage extends Message {
  constructor(...args) {
    super(...args);

    const whenNullOrEmpty = Joi.valid(['', null]);
    this.schema = Joi.object()
      .keys({
        northstarId: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
        broadcastId: Joi.string().required().empty(whenNullOrEmpty),
      });
  }

  getBroadcastId() {
    return this.getData().broadcastId;
  }

  getNorthstarId() {
    return this.getData().northstarId;
  }
}

module.exports = CustomerIoGambitBroadcastMessage;
