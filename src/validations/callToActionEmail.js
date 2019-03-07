'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum.
const schema = Joi.object()
  .keys({
    actionText: Joi.string().required().empty(whenNullOrEmpty),
    actionUrl: Joi.string().required().empty(whenNullOrEmpty),
    intro: Joi.string().required().empty(whenNullOrEmpty),
    outro: Joi.string().required().empty(whenNullOrEmpty),
    subject: Joi.string().required().empty(whenNullOrEmpty),
    userId: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
  });

module.exports = schema;
