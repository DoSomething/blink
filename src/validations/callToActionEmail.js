'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum.
const schema = Joi.object()
  .keys({
    actionText: Joi.string().empty(whenNullOrEmpty),
    actionUrl: Joi.string().required().empty(whenNullOrEmpty),
    intro: Joi.string().empty(whenNullOrEmpty),
    outro: Joi.string().empty(whenNullOrEmpty),
    subject: Joi.string().empty(whenNullOrEmpty),
    // TODO: This should be required once Northstar starts sending it.
    type: Joi.string().empty(whenNullOrEmpty),
    userId: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
  });

module.exports = schema;
