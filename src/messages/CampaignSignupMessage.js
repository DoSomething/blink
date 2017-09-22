'use strict';

const Joi = require('joi');
const moment = require('moment');

const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const CustomerIoEvent = require('../models/CustomerIoEvent');
const Message = require('./Message');

class CampaignSignupMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    // TODO: move to helpers.
    const whenNullOrEmpty = Joi.valid(['', null]);

    this.schema = Joi.object()
      .keys({
        id: Joi.required().empty(whenNullOrEmpty),
        northstar_id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
        campaign_id: Joi.string().required().empty(whenNullOrEmpty),
        campaign_run_id: Joi.string().required().empty(whenNullOrEmpty),
        source: Joi.string().empty(whenNullOrEmpty).default(undefined),
        created_at: Joi.string().required().empty(whenNullOrEmpty).isoDate(),
      });
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const message = new CampaignSignupMessage({
      data: ctx.request.body,
      meta: {
        request_id: ctx.id,
      },
    });
    return message;
  }

  static fromRabbitMessage(rabbitMessage) {
    const payload = this.parseIncomingPayload(rabbitMessage);
    if (!payload.data || !payload.meta) {
      throw new MessageParsingBlinkError('No data in message', payload);
    }

    // TODO: save more metadata
    // TODO: metadata parse helper
    const message = new CampaignSignupMessage({
      data: payload.data,
      meta: payload.meta,
    });
    message.fields = rabbitMessage.fields;
    return message;
  }

  toCustomerIoEvent() {
    const data = this.getData();
    const eventData = {
      // Convert signup id to a string for consistency.
      signup_id: String(data.id),
      campaign_id: data.campaign_id,
      campaign_run_id: data.campaign_run_id,
    };
    // TODO: transform iso to timestamp with correct TZ.
    eventData.created_at = moment(data.created_at).unix();

    if (data.source) {
      eventData.source = data.source;
    }

    const event = new CustomerIoEvent(
      data.northstar_id,
      'campaign_signup',
      eventData,
    );

    // Signup -> customer.io event transformation would only happen in this class.
    // It's safe to hardcode schema event version here.
    // Please bump it this when data schema changes.
    event.setVersion(1);
    return event;
  }
}

module.exports = CampaignSignupMessage;
