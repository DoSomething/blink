'use strict';

const Joi = require('joi');

const Message = require('./Message');

class CustomerIoGambitBroadcastMessage extends Message {
  constructor(...args) {
    super(...args);

    const whenNullOrEmpty = Joi.valid(['', null]);
    this.schema = Joi.object()
      .keys({
        addrState: Joi.string().empty(whenNullOrEmpty),
        broadcastId: Joi.string().required().empty(whenNullOrEmpty),
        // TODO: Remove this once we update Gambit webhook settings to output userId instead.
        northstarId: Joi.string().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
        // TODO: The following keys should be required once broadcastLite is live
        mobile: Joi.string().empty(whenNullOrEmpty),
        smsStatus: Joi.string().empty(whenNullOrEmpty),
        userId: Joi.string().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
      });
  }

  getMobileNumber() {
    return this.getData().mobile;
  }
}

module.exports = CustomerIoGambitBroadcastMessage;
