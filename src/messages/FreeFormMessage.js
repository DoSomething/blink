'use strict';

const Joi = require('joi');

const Message = require('./Message');

class FreeFormMessage extends Message {
  constructor(...args) {
    super(...args);

    this.schema = Joi.object()
      // Allow presence of all other keys.
      .unknown();
  }
}

module.exports = FreeFormMessage;
