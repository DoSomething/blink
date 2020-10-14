'use strict';

const FreeFormMessage = require('../../messages/FreeFormMessage');
const WebController = require('./WebController');
const basicAuthStrategy = require('../middleware/auth/strategies/basicAuth');

class EventsWebController extends WebController {
  constructor(...args) {
    super(...args);
    this.initRouter();
  }

  initRouter() {
    this.router.get('v1.events',
      '/api/v1/events',
      basicAuthStrategy(this.blink.config.app.auth),
      this.index.bind(this));
    this.router.post(
      'v1.events.quasar-relay',
      '/api/v1/events/quasar-relay',
      basicAuthStrategy(this.blink.config.app.auth),
      this.quasarRelay.bind(this),
    );
  }

  async index(ctx) {
    ctx.body = {
      'quasar-relay': this.fullUrl('v1.events.quasar-relay'),
    };
  }

  async quasarRelay(ctx) {
    try {
      const message = FreeFormMessage.fromCtx(ctx);
      message.validate();
      this.blink.broker.publishToRoute(
        '*.event.quasar',
        message,
      );
      this.sendOK(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = EventsWebController;
