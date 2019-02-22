'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum.
const schema = Joi.object()
  .keys({
    user_id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
    subject: Joi.string().required().empty(whenNullOrEmpty),
    body_greeting: Joi.string().required().empty(whenNullOrEmpty),
    body_closing: Joi.string().required().empty(whenNullOrEmpty),
    reset_url: Joi.string().required().empty(whenNullOrEmpty),
    reset_label: Joi.string().required().empty(whenNullOrEmpty),
  });

module.exports = schema;
