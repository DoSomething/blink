'use strict';

const Joi = require('joi');

const whenNullOrEmpty = Joi.valid(['', null]);

// Required minimum
const schema = Joi.object().keys({
  id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
  updated_at: Joi.required().empty(whenNullOrEmpty),
  created_at: Joi.required().empty(whenNullOrEmpty),

  // Remove field when provided as empty string or null.
  email: Joi.string().empty(whenNullOrEmpty).default(undefined),
  mobile: Joi.string().empty(whenNullOrEmpty).default(undefined),

  // Although this is NOT required to be sent, we make it implicitly required to exist in
  // the payload we send to C.io by declaring a default.
  // Allow anything as a role, but default to user.
  role: Joi.string().empty(whenNullOrEmpty).default('user'),
})
  // Require presence at least one of: email, mobile.
  .or('email', 'mobile');

module.exports = schema;
