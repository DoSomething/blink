'use strict';

const logger = require('../../../../config/logger');

function logMemUsage() {
  const used = process.memoryUsage();
  Object.keys(used).forEach((key) => {
    logger.debug(`${key} ${Math.round(used[key] / 1024 / (1024 * 100)) / 100} MB`);
  });
}

module.exports = {
  logMemUsage,
};
