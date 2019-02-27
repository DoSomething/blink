'use strict';

const enabled = process.env.BLINK_LOGGER_TRANSFORMER_LEANIFY === 'true';

// Keys that bloat the log without adding significant value
const bloatKeys = [
  'AccountSid',
  'ApiVersion',
  'body',
  'deliveredAt',
  'failedAt',
  'MessagingServiceSid',
  'SmsMessageSid',
  'SmsSid',
  'subject',
  'url',
];

module.exports = {
  enabled,
  bloatKeys,
};
