'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum.
const schema = Joi.object()
  .keys({
    id: Joi.required().empty(whenNullOrEmpty),
    signup_id: Joi.required().empty(whenNullOrEmpty),
    campaign_id: Joi.string().required().empty(whenNullOrEmpty),
    northstar_id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
    type: Joi.string().required().empty(whenNullOrEmpty),
    action: Joi.string().required().empty(whenNullOrEmpty),
    created_at: Joi.string().required().empty(whenNullOrEmpty).isoDate(), // Time stamp.
  });

module.exports = schema;
