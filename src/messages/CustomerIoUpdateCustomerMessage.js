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

        phone: Joi.string().empty(whenNullOrEmpty).default(undefined),

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

        sms_status: Joi.valid([
          'active',
          'less',
          'undeliverable',
          'unknown',
          null,
        ]).empty(whenNullOrEmpty).default(undefined),

        // Optional, defaults to undefined when provided as empty string or null.
        last_authenticated_at: optionalTimestampDefaultsToUndefined,
        // Exception: kept as an isodate
        birthdate: Joi.string()
          .empty(whenNullOrEmpty)
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
        unsubscribed: Joi.boolean().empty(whenNullOrEmpty).default(undefined),

        // Allow anything as a role, but default to user.
        role: Joi.string().empty(whenNullOrEmpty).default('user'),

        // When interests not present, make them an empty array.
        interests: Joi.array().items(Joi.string()).empty(null).default(undefined),

        // TODO: add more cio specific fields, like unsubscribed_at
      }).or('email', 'phone'),
    });
  }

  static fromUser(userMessage) {
    const user = userMessage.getData();
    // Copy user fields.
    const customerData = Object.assign({}, user);
    // Remove id from data, as it's available on the top level.
    delete customerData.id;

    // Rename mobile to phone
    if (customerData.mobile) {
      customerData.phone = customerData.mobile;
      delete customerData.mobile;
    }

    customerData.created_at = moment(customerData.created_at, moment.ISO_8601).unix();
    customerData.updated_at = moment(customerData.updated_at, moment.ISO_8601).unix();

    if (customerData.last_authenticated_at) {
      customerData.last_authenticated_at = moment(
        customerData.last_authenticated_at,
        moment.ISO_8601,
      ).unix();
    }

    // If a user is newly created (created_at & updated_at are the same)
    // then set them as "subscribed" to emails in Customer.io!
    const isNew = customerData.created_at === customerData.updated_at;
    if (customerData.email && isNew) {
      customerData.unsubscribed = false;
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
