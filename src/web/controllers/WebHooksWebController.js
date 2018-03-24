'use strict';

const moment = require('moment');

const CustomerioGambitBroadcastMessage = require('../../messages/CustomerioGambitBroadcastMessage');
const CustomerIoWebhookMessage = require('../../messages/CustomerIoWebhookMessage');
const FreeFormMessage = require('../../messages/FreeFormMessage');
const TwilioOutboundStatusCallbackMessage = require('../../messages/TwilioOutboundStatusCallbackMessage');
const TwilioStatusCallbackMessage = require('../../messages/TwilioStatusCallbackMessage');
const WebController = require('./WebController');
const basicAuthStrategy = require('../middleware/auth/strategies/basicAuth');
const twilioSignatureStrategy = require('../middleware/auth/strategies/twilioSignature');

class WebHooksWebController extends WebController {
  constructor(...args) {
    super(...args);
    this.initRouter();
  }

  initRouter() {
    this.router.get('v1.webhooks', '/api/v1/webhooks', this.index.bind(this));
    this.router.post(
      'v1.webhooks.customerio-email-activity',
      '/api/v1/webhooks/customerio-email-activity',
      basicAuthStrategy(this.blink.config.app.auth),
      this.customerioEmailActivity.bind(this),
    );
    this.router.post(
      'v1.webhooks.customerio-gambit-broadcast',
      '/api/v1/webhooks/customerio-gambit-broadcast',
      basicAuthStrategy(this.blink.config.app.auth),
      this.customerioGambitBroadcast.bind(this),
    );
    this.router.post(
      'v1.webhooks.twilio-sms-broadcast',
      '/api/v1/webhooks/twilio-sms-broadcast',
      basicAuthStrategy(this.blink.config.app.auth),
      this.twilioSmsBroadcast.bind(this),
    );
    this.router.post(
      'v1.webhooks.twilio-sms-inbound',
      '/api/v1/webhooks/twilio-sms-inbound',
      twilioSignatureStrategy(this.blink.config.twilio),
      this.twilioSmsInbound.bind(this),
    );
    this.router.post(
      'v1.webhooks.twilio-sms-outbound-status',
      '/api/v1/webhooks/twilio-sms-outbound-status',
      twilioSignatureStrategy(this.blink.config.twilio),
      this.twilioSmsOutboundStatus.bind(this),
    );
  }

  async index(ctx) {
    ctx.body = {
      'customerio-email-activity': this.fullUrl('v1.webhooks.customerio-email-activity'),
      'customerio-gambit-broadcast': this.fullUrl('v1.webhooks.customerio-gambit-broadcast'),
      'twilio-sms-broadcast': this.fullUrl('v1.webhooks.twilio-sms-broadcast'),
      'twilio-sms-inbound': this.fullUrl('v1.webhooks.twilio-sms-inbound'),
      'twilio-sms-outbound-status': this.fullUrl('v1.webhooks.twilio-sms-outbound-status'),
    };
  }

  async customerioEmailActivity(ctx) {
    try {
      const customerIoWebhookMessage = CustomerIoWebhookMessage.fromCtx(ctx);
      customerIoWebhookMessage.validate();
      const { quasarCustomerIoEmailActivityQ } = this.blink.queues;
      quasarCustomerIoEmailActivityQ.publish(customerIoWebhookMessage);
      this.sendOK(ctx, customerIoWebhookMessage);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async customerioGambitBroadcast(ctx) {
    try {
      const message = CustomerioGambitBroadcastMessage.fromCtx(ctx);
      message.validate();
      const { customerioGambitBroadcastQ } = this.blink.queues;
      customerioGambitBroadcastQ.publish(message);
      this.sendOK(ctx, message, 201);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async twilioSmsOutboundStatus(ctx) {
    try {
      const message = TwilioOutboundStatusCallbackMessage.fromCtx(ctx);
      message.validate();

      if (message.isError()) {
        message.setFailedAt(moment().format());
        this.blink.broker.publishToRoute(
          'sms-outbound-error.twilio.webhook',
          message,
        );
      } else if (message.isDelivered()) {
        /**
         * We don't get this info in the status callback payload from Twilio so we have to
         * set ourselves
         */
        message.setDeliveredAt(moment().format());
        this.blink.broker.publishToRoute(
          'sms-outbound-status.twilio.webhook',
          message,
        );
      }

      // See https://www.twilio.com/docs/api/twiml/sms/your_response.
      this.sendOKNoContent(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async twilioSmsInbound(ctx) {
    try {
      const message = FreeFormMessage.fromCtx(ctx);
      message.validate();
      this.blink.broker.publishToRoute(
        'sms-inbound.twilio.webhook',
        message,
      );
      // See https://www.twilio.com/docs/api/twiml/sms/your_response.
      this.sendOKNoContent(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async twilioSmsBroadcast(ctx) {
    try {
      const message = TwilioStatusCallbackMessage.fromCtx(ctx);
      message.validate();
      this.blink.broker.publishToRoute(
        'sms-broadcast.status-callback.twilio.webhook',
        message,
      );
      // See https://www.twilio.com/docs/api/twiml/sms/your_response.
      this.sendOKNoContent(ctx, message);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = WebHooksWebController;
