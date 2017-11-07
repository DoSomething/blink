'use strict';

const CustomerioSmsBroadcastMessage = require('../../messages/CustomerioSmsBroadcastMessage');
const CustomerIoWebhookMessage = require('../../messages/CustomerIoWebhookMessage');
const FreeFormMessage = require('../../messages/FreeFormMessage');
const MdataMessage = require('../../messages/MdataMessage');
const TwilioStatusCallbackMessage = require('../../messages/TwilioStatusCallbackMessage');
const WebController = require('./WebController');

class WebHooksWebController extends WebController {
  constructor(...args) {
    super(...args);
    // Bind web methods to object context so they can be passed to router.
    this.index = this.index.bind(this);
    this.customerioEmailActivity = this.customerioEmailActivity.bind(this);
    this.customerioSmsBroadcast = this.customerioSmsBroadcast.bind(this);
    this.gambitChatbotMdata = this.gambitChatbotMdata.bind(this);
    this.mocoMessageData = this.mocoMessageData.bind(this);
    this.twilioSmsBroadcast = this.twilioSmsBroadcast.bind(this);
    this.twilioSmsInbound = this.twilioSmsInbound.bind(this);
  }

  async index(ctx) {
    ctx.body = {
      'customerio-email-activity': this.fullUrl('api.v1.webhooks.customerio-email-activity'),
      'customerio-sms-broadcast': this.fullUrl('api.v1.webhooks.customerio-sms-broadcast'),
      'gambit-chatbot-mdata': this.fullUrl('api.v1.webhooks.gambit-chatbot-mdata'),
      'moco-message-data': this.fullUrl('api.v1.webhooks.moco-message-data'),
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

  async gambitChatbotMdata(ctx) {
    try {
      const mdataMessage = MdataMessage.fromCtx(ctx);
      mdataMessage.validate();
      const { gambitChatbotMdataQ } = this.blink.queues;
      gambitChatbotMdataQ.publish(mdataMessage);
      this.sendOK(ctx, mdataMessage, 200);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async mocoMessageData(ctx) {
    try {
      // Todo: looks like I should have used TwilioStatusCallbackMessage here.
      const freeFormMessage = FreeFormMessage.fromCtx(ctx);
      freeFormMessage.validate();
      const { mocoMessageDataQ } = this.blink.queues;
      mocoMessageDataQ.publish(freeFormMessage);
      this.sendOK(ctx, freeFormMessage);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }

  async twilioSmsInbound(ctx) {
    try {
      const message = FreeFormMessage.fromCtx(ctx);
      message.validate();
      this.blink.exchange.publish(
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
      this.blink.exchange.publish(
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
