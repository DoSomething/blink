'use strict';

const enabled = process.env.BLINK_LOGGER_TRANSFORMER_LEANIFY === 'true';

// Keys that bloat the log without adding significant value
const bloatKeys = [
  'AccountSid',
  'actionText',
  'actionUrl',
  'ApiVersion',
  'deliveredAt',
  'failedAt',
  'intro',
  'MessagingServiceSid',
  'outro',
  'SmsMessageSid',
  'SmsSid',
  'subject',
];

module.exports = {
  enabled,
  bloatKeys,
};
