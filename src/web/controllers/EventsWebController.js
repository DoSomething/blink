'use strict';

const CampaignSignupMessage = require('../../messages/CampaignSignupMessage');
const CampaignSignupPostMessage = require('../../messages/CampaignSignupPostMessage');
const UserMessage = require('../../messages/UserMessage');
const WebController = require('./WebController');

class EventsWebController extends WebController {
  constructor(...args) {
    super(...args);
    // Bind web methods to object context so they can be passed to router.
    this.index = this.index.bind(this);
    this.userCreate = this.userCreate.bind(this);
    this.userSignup = this.userSignup.bind(this);
    this.userSignupPost = this.userSignupPost.bind(this);
  }

  async index(ctx) {
    ctx.body = {
      'user-create': this.fullUrl('api.v1.events.user-create'),
      'user-signup': this.fullUrl('api.v1.events.user-signup'),
      'user-signup-post': this.fullUrl('api.v1.events.user-signup-post'),
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

  async userSignup(ctx) {
    try {
      const message = CampaignSignupMessage.fromCtx(ctx);
      message.validateStrict();
      this.blink.exchange.publish(
        'signup.user.event',
        message,
      );
      this.sendOK(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async userSignupPost(ctx) {
    try {
      const message = CampaignSignupPostMessage.fromCtx(ctx);
      message.validateStrict();
      this.blink.exchange.publish(
        'signup-post.user.event',
        message,
      );
      this.sendOK(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = EventsWebController;
