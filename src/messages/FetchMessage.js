'use strict';

const Joi = require('joi');

const Message = require('./Message');

// TODO: url whitelist
// TODO: authentication
class FetchMessage extends Message {
  constructor(...args) {
    super(...args);

    // Data validation rules.
    this.schema = Joi.object().keys({
      url: Joi.string().required(),
      options: Joi.object(),
    });
  }
}

module.exports = FetchMessage;
