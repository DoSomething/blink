'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum.
const schema = Joi.object()
  .keys({
    id: Joi.required().empty(whenNullOrEmpty),
    northstar_id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
    campaign_id: Joi.string().required().empty(whenNullOrEmpty),
    source: Joi.string().empty(whenNullOrEmpty).default(undefined),
  });

module.exports = schema;
