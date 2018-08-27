'use strict';

const config = {};
/**
 * Keys should match event names in C.io.
 *
 * @see https://customer.io/docs/developer-documentation/webhooks.html#events
 *
 * WARNING: In the worst case scenario that C.io changes an event
 * name without letting us know, this would be the place to fix routing issues.
 */
config.events = {
  /**
   * This is the catch all "generic" event that we will fallback to if we don't have a defined
   * C.io event config for it here.
   */
  generic: {
    routingKey: '*.event.quasar',
  },
  email_unsubscribed: {
    routingKey: 'email-unsubscribed.event.quasar',
  },
};

module.exports = config;
