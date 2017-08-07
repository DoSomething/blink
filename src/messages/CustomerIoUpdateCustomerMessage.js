'use strict';

const Joi = require('joi');
const moment = require('moment');

const Message = require('./Message');

class CustomerIoUpdateCustomerMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    // TODO: move to helpers.
    const whenNullOrEmpty = Joi.valid(['', null]);
    const optionalStringDefaultsToUndefined = Joi
      .string()
      .empty(whenNullOrEmpty)
      .default(undefined);

    const optionalTimestampDefaultsToUndefined = Joi
      .date()
      .timestamp('unix')
      .raw()
      .empty(whenNullOrEmpty)
      .default(undefined);

    this.schema = Joi.object().keys({
      id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
      data: Joi.object().required().keys({
        // Remove field when provided as empty string or null.
        email: Joi.string().empty(whenNullOrEmpty).default(undefined),

        // TODO: make sure has E.164 format
        // phone: Joi.string().empty(whenNullOrEmpty).default(undefined),

        // Required:
        updated_at: Joi.date()
          .required()
          .empty(whenNullOrEmpty)
          .timestamp('unix')
          .raw(),
        created_at: Joi.date()
          .required()
          .empty(whenNullOrEmpty)
          .timestamp('unix')
          .raw(),

        mobile_status: Joi.valid([
          'active',
          'undeliverable',
          'unknown',
          null,
        ]).empty(whenNullOrEmpty).default(undefined),

        // Optional, defaults to undefined when provided as empty string or null.
        last_authenticated_at: optionalTimestampDefaultsToUndefined,
        // Exception: kept as an isodate
        birthdate: Joi.string()
          .empty(whenNullOrEmpty)
          .isoDate()
          .regex(/^(\d{4})-(\d{2})-(\d{2})$/, 'valid birthdate')
          .default(undefined),
        first_name: optionalStringDefaultsToUndefined,
        last_name: optionalStringDefaultsToUndefined,
        addr_city: optionalStringDefaultsToUndefined,
        addr_state: optionalStringDefaultsToUndefined,
        addr_zip: optionalStringDefaultsToUndefined,
        source: optionalStringDefaultsToUndefined,
        source_detail: optionalStringDefaultsToUndefined,
        language: optionalStringDefaultsToUndefined,
        country: optionalStringDefaultsToUndefined,
        facebook_id: optionalStringDefaultsToUndefined,
        // TODO: Only explicitly set for new users.
        unsubscribed: Joi.boolean().empty(whenNullOrEmpty).default(undefined),
        subscribed_at: optionalTimestampDefaultsToUndefined,

        // Allow anything as a role, but default to user.
        role: Joi.string().empty(whenNullOrEmpty).default('user'),

        // When interests not present, make them an empty array.
        interests: Joi.array().items(Joi.string()).empty(null).default(undefined),

        // TODO: add more cio specific fields, like unsubscribed_at
      }),
      // TODO: Bring back when phone is formatted in Northstar
      // .or('email', 'phone'),
    });
  }

  static fromUser(userMessage, isNew = false) {
    const user = userMessage.getData();
    // Copy user fields.
    const customerData = Object.assign({}, user);
    // Remove id from data, as it's available on the top level.
    delete customerData.id;

    // Rename mobile to phone
    // TODO: format phone

    if (customerData.mobile) {
      // const mobile = customerData.mobile;
      delete customerData.mobile;
      // TODO: Bring back when phone is formatted in Northstar
      // customerData.phone = mobile;
    }

    customerData.created_at = moment(customerData.created_at, moment.ISO_8601).unix();
    customerData.updated_at = moment(customerData.updated_at, moment.ISO_8601).unix();

    if (customerData.last_authenticated_at) {
      customerData.last_authenticated_at = moment(
        customerData.last_authenticated_at,
        moment.ISO_8601,
      ).unix();
    }

    if (isNew) {
      customerData.unsubscribed = false;
      customerData.subscribed_at = moment().unix();
    }

    const customerIoUpdateCustomerMessage = new CustomerIoUpdateCustomerMessage({
      data: {
        id: user.id,
        data: customerData,
      },
      meta: {
        request_id: userMessage.getRequestId(),
      },
    });
    return customerIoUpdateCustomerMessage;
  }
}

module.exports = CustomerIoUpdateCustomerMessage;
