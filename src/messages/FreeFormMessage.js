'use strict';

const Joi = require('joi');

const Message = require('./Message');
const MessageValidationBlinkError = require('../errors/MessageValidationBlinkError');

class FreeFormMessage extends Message {
  constructor(...args) {
    super(...args);

    this.schema = Joi.object()
      // Allow presence of all other keys.
      .unknown();
  }

  validate() {
    const { error, value } = Joi.validate(
      this.getData(),
      this.schema || {},
    );
    if (error) {
      throw new MessageValidationBlinkError(error.message, this.toString());
    }

    this.payload.data = value;
    return true;
  }
}

module.exports = FreeFormMessage;
