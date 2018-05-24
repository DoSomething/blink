'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum
const schema = Joi.object().keys({
  id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
  updated_at: Joi.required().empty(whenNullOrEmpty),
  created_at: Joi.required().empty(whenNullOrEmpty),

  // Although this is NOT required to be sent, we make it implicitly required to exist in
  // the payload we send to C.io by declaring a default.
  // Allow anything as a role, but default to user.
  role: Joi.string().empty(whenNullOrEmpty).default('user'),
});

module.exports = schema;
