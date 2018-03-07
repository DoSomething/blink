'use strict';

const CampaignSignupMessage = require('../../messages/CampaignSignupMessage');
const CampaignSignupPostMessage = require('../../messages/CampaignSignupPostMessage');
const CampaignSignupPostReviewMessage = require('../../messages/CampaignSignupPostReviewMessage');
const FreeFormMessage = require('../../messages/FreeFormMessage');
const UserMessage = require('../../messages/UserMessage');
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
      'v1.events.user-create',
      '/api/v1/events/user-create',
      basicAuthStrategy(this.blink.config.app.auth),
      this.userCreate.bind(this),
    );
    this.router.post(
      'v1.events.user-signup',
      '/api/v1/events/user-signup',
      basicAuthStrategy(this.blink.config.app.auth),
      this.userSignup.bind(this),
    );
    this.router.post(
      'v1.events.user-signup-post',
      '/api/v1/events/user-signup-post',
      basicAuthStrategy(this.blink.config.app.auth),
      this.userSignupPost.bind(this),
    );
    this.router.post(
      'v1.events.user-signup-post-review',
      '/api/v1/events/user-signup-post-review',
      basicAuthStrategy(this.blink.config.app.auth),
      this.userSignupPostReview.bind(this),
    );
    this.router.post(
      'v1.events.quasar-relay',
      '/api/v1/events/quasar-relay',
      basicAuthStrategy(this.blink.config.app.auth),
      this.quasarRelay.bind(this),
    );
  }

  async index(ctx) {
    ctx.body = {
      'user-create': this.fullUrl('v1.events.user-create'),
      'user-signup': this.fullUrl('v1.events.user-signup'),
      'user-signup-post': this.fullUrl('v1.events.user-signup-post'),
      'user-signup-post-review': this.fullUrl('v1.events.user-signup-post-review'),
      'quasar-relay': this.fullUrl('v1.events.quasar-relay'),
    };
  }

  async userCreate(ctx) {
    try {
      const userMessage = UserMessage.fromCtx(ctx);
      userMessage.validate();
      this.blink.broker.publishToRoute(
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
      this.blink.broker.publishToRoute(
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
      message.validate();
      this.blink.broker.publishToRoute(
        'signup-post.user.event',
        message,
      );
      this.sendOK(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async userSignupPostReview(ctx) {
    try {
      const message = CampaignSignupPostReviewMessage.fromCtx(ctx);
      message.validate();
      this.blink.broker.publishToRoute(
        'signup-post-review.user.event',
        message,
      );
      this.sendOK(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async quasarRelay(ctx) {
    try {
      const message = FreeFormMessage.fromCtx(ctx);
      message.validate();
      this.blink.broker.publishToRoute(
        'generic-event.quasar',
        message,
      );
      this.sendOK(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = EventsWebController;
