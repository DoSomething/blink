'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum.
const schema = Joi.object()
  .keys({
    user_id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
    subject: Joi.string().required().empty(whenNullOrEmpty),
    body: Joi.string().required().empty(whenNullOrEmpty),
    type: Joi.string().required().empty(whenNullOrEmpty),
    url: Joi.string().required().empty(whenNullOrEmpty),
  });

module.exports = schema;
