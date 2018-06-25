'use strict';

// TODO (maintenance): Update to 3.0.0 which has breaking changes.
const winston = require('winston');

// Setup winston default instance
const LOGGER_LEVEL = process.env.LOGGER_LEVEL || 'debug';
const LOGGER_TIMESTAMP = !(process.env.LOGGER_TIMESTAMP === 'false');
const LOGGER_COLORIZE = !(process.env.LOGGER_COLORIZE === 'false');
const LOGGER_PRETTY_PRINT = !(process.env.LOGGER_PRETTY_PRINT === 'false');

winston.configure({
  transports: [
    new winston.transports.Console({
      prettyPrint: LOGGER_PRETTY_PRINT,
      colorize: LOGGER_COLORIZE,
      level: LOGGER_LEVEL,
      showLevel: true,
      formatter: (options) => {
        // TODO: move to app?
        const message = [];
        if (LOGGER_TIMESTAMP) {
          const date = new Date().toISOString();
          message.push(winston.config.colorize(options.level, date));
          // TODO: log dyno name
          let dyneName = winston.config.colorize(options.level, 'app[]');
          dyneName += ':';
          message.push(dyneName);
        }
        message.push(`at=${options.level}`);
        // TODO: get from config
        message.push('application=blink');

        const meta = options.meta || {};
        Object.entries(meta).forEach(([key, value]) => {
          message.push(`${key}=${value}`);
        });
        if (options.message) {
          message.push(options.message);
        }
        return message.join(' ');
      },
    }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      prettyPrint: LOGGER_PRETTY_PRINT,
      colorize: LOGGER_COLORIZE,
    }),
  ],
});


winston.setLevels(winston.config.syslog.levels);
winston.addColors(winston.config.syslog.colors);
