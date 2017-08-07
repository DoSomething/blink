'use strict';

const CustomerIoWebhookMessage = require('../../messages/CustomerIoWebhookMessage');
const FreeFormMessage = require('../../messages/FreeFormMessage');
const MdataMessage = require('../../messages/MdataMessage');
const WebController = require('./WebController');

class WebHooksWebController extends WebController {
  constructor(...args) {
    super(...args);
    // Bind web methods to object context so they can be passed to router.
    this.index = this.index.bind(this);
    this.customerioEmailActivity = this.customerioEmailActivity.bind(this);
    this.gambitChatbotMdata = this.gambitChatbotMdata.bind(this);
    this.mocoMessageData = this.mocoMessageData.bind(this);
  }

  async index(ctx) {
    ctx.body = {
      'customerio-email-activity': this.fullUrl('api.v1.webhooks.customerio-email-activity'),
      'gambit-chatbot-mdata': this.fullUrl('api.v1.webhooks.gambit-chatbot-mdata'),
      'moco-message-data': this.fullUrl('api.v1.webhooks.moco-message-data'),
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
      const freeFormMessage = FreeFormMessage.fromCtx(ctx);
      freeFormMessage.validate();
      const { mocoMessageDataQ } = this.blink.queues;
      mocoMessageDataQ.publish(freeFormMessage);
      this.sendOK(ctx, freeFormMessage);
    } catch (error) {
      this.sendError(ctx, error);
    }
  }
}

module.exports = WebHooksWebController;
