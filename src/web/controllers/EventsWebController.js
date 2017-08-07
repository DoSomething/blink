'use strict';

const UserMessage = require('../../messages/UserMessage');
const WebController = require('./WebController');

class EventsWebController extends WebController {
  constructor(...args) {
    super(...args);
    // Bind web methods to object context so they can be passed to router.
    this.index = this.index.bind(this);
    this.userCreate = this.userCreate.bind(this);
  }

  async index(ctx) {
    ctx.body = {
      'user-create': this.fullUrl('api.v1.events.user-create'),
    };
  }

  async userCreate(ctx) {
    try {
      const userMessage = UserMessage.fromCtx(ctx);
      userMessage.validateStrict();
      this.blink.exchange.publish(
        'create.user.event',
        userMessage,
      );
      this.sendOK(ctx, userMessage);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = EventsWebController;
