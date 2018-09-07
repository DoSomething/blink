'use strict';

const { createLogger, config: winstonConfig, format, transports } = require('winston');

const { colorize, printf } = format;

// Setup winston default instance
const LOGGER_LEVEL = process.env.LOGGER_LEVEL || 'debug';
const APP_NAME = process.env.BLINK_APP_NAME || 'blink';

// TODO: Move to /lib/logger
function formatter(info) {
  const message = [];
  const meta = info.meta || {};
  message.push(`at=${info.level}`);
  message.push(`application=${APP_NAME}`);
  Object.entries(meta).forEach(([key, value]) => {
    message.push(`${key}=${value}`);
  });
  // TODO: Really nice to have: log if we are actively removing PII
  // PII-removal-enabled=true|false
  if (info.message) {
    message.push(info.message);
  }
  return message.join(' ');
}

// TODO: Move to /lib/logger
const logger = createLogger({
  level: LOGGER_LEVEL,
  levels: winstonConfig.syslog.levels,
  format: colorize({
    colors: winstonConfig.syslog.colors,
    all: true,
  }),
  transports: [
    new transports.Console({
      format: printf(formatter),
    }),
  ],
  exceptionHandlers: [
    new transports.Console(),
  ],
});

module.exports = logger;
