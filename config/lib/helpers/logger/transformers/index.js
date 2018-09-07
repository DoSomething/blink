'use strict';

const config = {
  removePII: {},
};
config.removePII.enabled = process.env.BLINK_LOGGER_TRANSFORMER_REMOVE_PII === 'true';
// Keys containing PII (Personal Identifiable Information) in payload coming from Northstar
config.removePII.northstarPIIKeys = [
  'email',
  'mobile',
  'phone',
  'birthdate',
  'first_name',
  'last_name',
  'last_initial',
  'addr_street1',
  'addr_street2',
  'addr_city',
  'addr_state',
];
/**
 * Keys containing PII (Personal Identifiable Information) in payload coming from C.io
 *
 * All messages have this internal payload structure `{ data: {}, meta: {} }`.
 * Customer.io sends us their data wrapped in a data object, creating the `data.data` nested
 * object. So, starting the key with `data` here, it's intentional.
 */
config.removePII.customerIoPIIKeys = [
  'data.email_address',
  'data.variables.customer.email',
  'data.variables.customer.birthdate',
  'data.variables.customer.18th_birthday',
  'data.variables.customer.first_name',
  'data.variables.customer.last_name',
  'data.variables.customer.addr_city',
  'data.variables.customer.addr_state',
  'data.variables.customer.addr_street1',
  'data.variables.customer.addr_street2',
  'data.variables.customer.phone',
  'data.variables.customer.mobile',
  'data.variables.customer.data',
];
module.exports = config;
