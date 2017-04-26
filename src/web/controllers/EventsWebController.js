'use strict';

const WebController = require('./WebController');

class EventsWebController extends WebController {
  constructor(...args) {
    super(...args);
    // Bind web methods to object context so they can be passed to router.
    this.index = this.index.bind(this);
    this.userRegistration = this.userRegistration.bind(this);
  }

  async index(ctx) {
    ctx.body = {
      'user-registration': this.fullUrl('api.v1.events.user-registration'),
    };
  }

  async userRegistration(ctx) {
    this.sendOK(ctx);
  }
}

module.exports = EventsWebController;
