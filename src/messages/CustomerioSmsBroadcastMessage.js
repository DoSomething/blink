'use strict';

const Joi = require('joi');

const Message = require('./Message');

class CustomerioSmsBroadcastMessage extends Message {
  constructor(...args) {
    super(...args);

    const whenNullOrEmpty = Joi.valid(['', null]);
    const statusRegex = /broadcastId=.+$/;
    this.schema = Joi.object()
      .keys({
        // Note: first char of To is plus, which is resolved to a space by mistake.
        To: Joi.string().required().empty(whenNullOrEmpty).regex(/^\+1[0-9]+$/, 'valid phone number'),
        Body: Joi.string().required().empty(whenNullOrEmpty),
        StatusCallback: Joi.string().required().empty(whenNullOrEmpty).regex(statusRegex, 'valid status callback'),
      });
  }

  getBody() {
    return this.getData().Body;
  }

  getPhoneNumber() {
    return this.getData().To;
  }

  getBroadcastId() {
    return this.getData().StatusCallback.match(/broadcastId=(.+)/)[1];
  }

  getMessageSid() {
    return this.getMeta().messageSid;
  }

  setMessageSid(messageSid) {
    this.getMeta().messageSid = messageSid;
  }
}

module.exports = CustomerioSmsBroadcastMessage;
