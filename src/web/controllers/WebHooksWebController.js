'use strict';

const CustomerioSmsBroadcastMessage = require('../../messages/CustomerioSmsBroadcastMessage');
const CustomerIoWebhookMessage = require('../../messages/CustomerIoWebhookMessage');
const FreeFormMessage = require('../../messages/FreeFormMessage');
const TwilioStatusCallbackMessage = require('../../messages/TwilioStatusCallbackMessage');
const WebController = require('./WebController');

class WebHooksWebController extends WebController {
  constructor(...args) {
    super(...args);
    // Bind web methods to object context so they can be passed to router.
    this.index = this.index.bind(this);
    this.customerioEmailActivity = this.customerioEmailActivity.bind(this);
    this.customerioSmsBroadcast = this.customerioSmsBroadcast.bind(this);
    this.twilioSmsBroadcast = this.twilioSmsBroadcast.bind(this);
    this.twilioSmsInbound = this.twilioSmsInbound.bind(this);
  }

  async index(ctx) {
    ctx.body = {
      'customerio-email-activity': this.fullUrl('api.v1.webhooks.customerio-email-activity'),
      'customerio-sms-broadcast': this.fullUrl('api.v1.webhooks.customerio-sms-broadcast'),
      'twilio-sms-broadcast': this.fullUrl('api.v1.webhooks.twilio-sms-broadcast'),
      'twilio-sms-inbound': this.fullUrl('api.v1.webhooks.twilio-sms-inbound'),
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

  async customerioSmsBroadcast(ctx) {
    try {
      const message = CustomerioSmsBroadcastMessage.fromCtx(ctx);
      message.validate();
      const { customerioSmsBroadcastRelayQ } = this.blink.queues;
      customerioSmsBroadcastRelayQ.publish(message);
      this.sendOK(ctx, message, 201);
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
