'use strict';

const enabled = process.env.BLINK_LOGGER_TRANSFORMER_LEANIFY === 'true';

// Keys that bloat the log without adding significant value
const bloatKeys = [
  'AccountSid',
  'ApiVersion',
  'deliveredAt',
  'failedAt',
  'MessagingServiceSid',
  'SmsMessageSid',
  'SmsSid',
];

module.exports = {
  enabled,
  bloatKeys,
};
