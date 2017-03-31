'use strict';

const Joi = require('joi');

const ValidationError = require('../errors/ValidationError');

class Message {

  constructor({ data, meta }) {
    this.data = data;
    this.meta = meta;
  }

  validate() {
    const {error, value} = Joi.validate(this.data, this.schema || {});
    if (error) {
      throw new ValidationError(error);
    }
    return true;
  }

}

module.exports = Message;