'use strict';

const enforceHttps = require('koa-sslify');
const logger = require('winston');

const enforceHttpsMiddleware = function (forceHttps) {
  logger.info(`Enforcing HTTPS connections=${forceHttps}`);
  if (!forceHttps) {
    return async (ctx, next) => next();
  }
  return enforceHttps({
    /**
     * Required for Heroku deployed apps
     * @see https://www.npmjs.com/package/koa-sslify#with-reverse-proxy
     */
    trustProtoHeader: true,
  });
};

module.exports = enforceHttpsMiddleware;
