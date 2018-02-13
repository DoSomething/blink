'use strict';

const Joi = require('joi');

const Message = require('./Message');
const schema = require('../validations/userCreateAndUpdate');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');

class UserMessage extends Message {
  constructor(...args) {
    super(...args);
    this.schema = schema;
  }

  validate() {
    const { error, value } = Joi.validate(
      this.getData(),
      this.schema || {},
      {
        allowUnknown: true,
      },
    );
    if (error) {
      throw new MessageValidationBlinkError(error.message, this.toString());
    }

    this.payload.data = value;
    return true;
  }
}

module.exports = UserMessage;
