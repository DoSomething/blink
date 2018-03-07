'use strict';

const WebController = require('./WebController');
const basicAuthStrategy = require('../middleware/auth/strategies/basicAuth');

class ApiWebController extends WebController {
  constructor(...args) {
    super(...args);
    this.initRouter();
  }

  initRouter() {
    this.router.get('api.index', '/api',
      basicAuthStrategy(this.blink.config.app.auth),
      this.index.bind(this));
    this.router.get('api.v1', '/api/v1',
      basicAuthStrategy(this.blink.config.app.auth),
      this.v1.bind(this));
  }

  async index(ctx) {
    ctx.body = {
      v1: this.fullUrl('api.v1'),
    };
  }

  async v1(ctx) {
    ctx.body = {
      tools: this.fullUrl('v1.tools'),
      events: this.fullUrl('v1.events'),
      webhooks: this.fullUrl('v1.webhooks'),
    };
  }
}

module.exports = ApiWebController;
