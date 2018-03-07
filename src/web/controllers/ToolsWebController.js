'use strict';

const FetchMessage = require('../../messages/FetchMessage');
const WebController = require('./WebController');
const basicAuthStrategy = require('../middleware/auth/strategies/basicAuth');

class ToolsWebController extends WebController {
  constructor(...args) {
    super(...args);
    this.initRouter();
  }

  initRouter() {
    this.router.get('v1.tools', '/api/v1/tools',
      basicAuthStrategy(this.blink.config.app.auth),
      this.index.bind(this));
    this.router.post('v1.tools.fetch', '/api/v1/tools/fetch',
      basicAuthStrategy(this.blink.config.app.auth),
      this.fetch.bind(this));
  }

  async index(ctx) {
    ctx.body = {
      fetch: this.fullUrl('v1.tools.fetch'),
    };
  }

  async fetch(ctx) {
    try {
      const fetchMessage = FetchMessage.fromCtx(ctx);
      fetchMessage.validate();
      const { fetchQ } = this.blink.queues;
      fetchQ.publish(fetchMessage);
      this.sendOK(ctx, fetchMessage);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = ToolsWebController;
