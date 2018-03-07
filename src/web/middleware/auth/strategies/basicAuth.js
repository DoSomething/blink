'use strict';

const auth = require('koa-basic-auth');

function basicAuth(authConfig) {
  return auth({
    name: authConfig.name,
    pass: authConfig.password,
  });
}

module.exports = basicAuth;
