'use strict';

const enabled = process.env.BLINK_LOGGER_TRANSFORMER_REMOVE_PII === 'true';

/**
 * Keys containing PII (Personal Identifiable Information) in payload coming from C.io
 *
 * All messages have this internal payload structure `{ data: {}, meta: {} }`.
 * Customer.io sends us their data wrapped in a data object, creating the `data.data` nested
 * object. So, starting the key with `data` here, it's intentional.
 */
const customerIoPIIKeys = [
  // From C.io webhook
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

const twilioPIIKeys = [
  'To',
  /**
   * This is considered PII in other payloads, but since the phone number
   * is the Twilio platform identifier I think we should log it.
   * TODO: Uncomment if considers PII and needs to be removed from logs.
   */
  // 'From',
];

module.exports = {
  enabled,
  customerIoPIIKeys,
  twilioPIIKeys,
  roguePIIKeys,
};
