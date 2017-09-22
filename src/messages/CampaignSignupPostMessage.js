'use strict';

const Joi = require('joi');
const moment = require('moment');

const MessageParsingBlinkError = require('../errors/MessageParsingBlinkError');
const CustomerIoEvent = require('../models/CustomerIoEvent');
const Message = require('./Message');

class CampaignSignupPostMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    // TODO: move to helpers.
    const whenNullOrEmpty = Joi.valid(['', null]);

    this.schema = Joi.object()
      .keys({
        // Required minimum.
        id: Joi.required().empty(whenNullOrEmpty),
        signup_id: Joi.required().empty(whenNullOrEmpty),
        northstar_id: Joi.string().required().empty(whenNullOrEmpty).regex(/^[0-9a-f]{24}$/, 'valid object id'),
        campaign_id: Joi.string().required().empty(whenNullOrEmpty),
        campaign_run_id: Joi.string().required().empty(whenNullOrEmpty),
        quantity: Joi.number().required(),

        // Optional fields
        source: Joi.string().empty(whenNullOrEmpty).default(undefined),
        caption: Joi.string().empty(whenNullOrEmpty).default(undefined),
        why_participated: Joi.string().empty(whenNullOrEmpty).default(undefined),
        url: Joi.string().uri().empty(whenNullOrEmpty).default(undefined),

        // Time stamp.
        created_at: Joi.string().required().empty(whenNullOrEmpty).isoDate(),
      });
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const message = new CampaignSignupPostMessage({
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
    const message = new CampaignSignupPostMessage({
      data: payload.data,
      meta: payload.meta,
    });
    message.fields = rabbitMessage.fields;
    return message;
  }

  toCustomerIoEvent() {
    const data = this.getData();
    const eventData = {
      // Convert ids to strings for consistency.
      signup_post_id: String(data.id),
      signup_id: String(data.signup_id),
      campaign_id: data.campaign_id,
      campaign_run_id: data.campaign_run_id,
      quantity: Number(data.quantity),
    };
    // TODO: transform iso to timestamp with correct TZ.
    eventData.created_at = moment(data.created_at).unix();

    // Optional fields.
    const optionalFields = [
      'source',
      'caption',
      'url',
      'why_participated',
    ];

    optionalFields.forEach((field) => {
      if (data[field]) {
        eventData[field] = data[field];
      }
    });

    // In future, Rogue will pass different campaign_signup_post types
    // for different kind of member actions. Now everything is considered
    // as 'action', which corresponds with "classic" Phoenix reportback.
    // @see https://github.com/DoSomething/blink/issues/125
    eventData.type = 'action';

    const event = new CustomerIoEvent(
      data.northstar_id,
      'campaign_signup_post',
      eventData,
    );
    // Signup post -> customer.io event transformation would only happen in this class.
    // It's safe to hardcode schema event version here.
    // Please bump it this when data schema changes.
    event.setVersion(1);
    return event;
  }
}

module.exports = CampaignSignupPostMessage;
