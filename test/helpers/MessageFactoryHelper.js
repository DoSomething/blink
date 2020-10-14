'use strict';

// ------- Imports -------------------------------------------------------------

const Chance = require('chance');

const CustomerIoSmsStatusActiveMessage = require('../../src/messages/CustomerIoSmsStatusActiveMessage');
const CustomerIoGambitBroadcastMessage = require('../../src/messages/CustomerIoGambitBroadcastMessage');
const FreeFormMessage = require('../../src/messages/FreeFormMessage');
const TwilioOutboundStatusCallbackMessage = require('../../src/messages/TwilioOutboundStatusCallbackMessage');
const CustomerIoWebhookMessage = require('../../src/messages/CustomerIoWebhookMessage');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

// ------- Helpers -------------------------------------------------------------

class MessageFactoryHelper {
  static getTwilioOutboundDeliveredStatusMessage(deliveredAt) {
    const sid = `${chance.pickone(['SM', 'MM'])}${chance.hash({ length: 32 })}`;
    const msg = new TwilioOutboundStatusCallbackMessage({
      data: {
        SmsSid: sid,
        SmsStatus: 'delivered',
        MessageStatus: 'delivered',
        To: MessageFactoryHelper.getFakeMobileNumber(),
        MessageSid: sid,
        AccountSid: sid,
        From: MessageFactoryHelper.getFakeMobileNumber(),
        ApiVersion: '2010-04-01',
      },
      meta: {},
    });
    if (deliveredAt) {
      msg.setDeliveredAt(deliveredAt);
    }
    return msg;
  }

  static getTwilioOutboundErrorStatusMessage(failedAt) {
    const sid = `${chance.pickone(['SM', 'MM'])}${chance.hash({ length: 32 })}`;
    const msg = new TwilioOutboundStatusCallbackMessage({
      data: {
        SmsSid: sid,
        SmsStatus: 'delivered',
        MessageStatus: 'delivered',
        To: MessageFactoryHelper.getFakeMobileNumber(),
        MessageSid: sid,
        AccountSid: sid,
        From: MessageFactoryHelper.getFakeMobileNumber(),
        ApiVersion: '2010-04-01',
        ErrorCode: 30006,
        ErrorMessage: 'Landline or unreachable carrier',
      },
      meta: {},
    });
    if (failedAt) {
      msg.setFailedAt(failedAt);
    }
    return msg;
  }

  static getTwilioInboundMessage() {
    const sid = `${chance.pickone(['SM', 'MM'])}${chance.hash({ length: 32 })}`;
    return new FreeFormMessage({
      data: {
        ToCountry: 'US',
        MediaContentType0: 'image/png',
        ToState: '',
        SmsMessageSid: sid,
        NumMedia: '1',
        ToCity: '',
        FromZip: chance.zip(),
        SmsSid: sid,
        FromState: chance.state({ territories: true }),
        SmsStatus: 'received',
        FromCity: chance.city(),
        Body: '',
        FromCountry: 'US',
        To: '38383',
        ToZip: '',
        NumSegments: '1',
        MessageSid: sid,
        From: MessageFactoryHelper.getFakeMobileNumber(),
        MediaUrl0: chance.avatar({ protocol: 'https' }),
        ApiVersion: '2010-04-01',
      },
      meta: {},
    });
  }

  static getRandomDataSample(nested = false) {
    const data = {};

    // Add random words.
    for (let i = 0; i < 8; i++) {
      data[chance.word()] = chance.word();
    }

    // One int.
    data[chance.word()] = chance.integer();

    // One bool
    data[chance.word()] = chance.bool();

    // Add nested object.
    if (nested) {
      data[chance.word()] = MessageFactoryHelper.getRandomDataSample();
    }

    return data;
  }

  static getRandomMessage(nested = false) {
    const data = MessageFactoryHelper.getRandomDataSample(nested);
    const meta = {
      request_id: chance.guid({ version: 4 }),
    };
    return new FreeFormMessage({ data, meta });
  }

  static getFakeRabbitMessage(content = false, consumerTag = false) {
    // @see http://www.squaremobius.net/amqp.node/channel_api.html#callbacks
    const rabbitMessage = {
      fields: {
        deliveryTag: chance.word(),
      },
      properties: {},
    };
    if (consumerTag) {
      rabbitMessage.fields.consumerTag = consumerTag;
    }

    // Generate random contentString if content is not provided.
    const contentString = content || MessageFactoryHelper.getRandomMessage().toString();

    // Todo: add option to set message tag.
    rabbitMessage.content = Buffer.from(contentString);
    return rabbitMessage;
  }

  static getRandomUrl() {
    return chance.url();
  }

  static getFakeMobileNumber() {
    return `+1555${chance.string({ length: 7, pool: '1234567890' })}`;
  }

  static getFakeUserId() {
    return chance.hash({ length: 24 });
  }

  static getBroadcastId() {
    return chance.word();
  }

  static getGambitBroadcastMessage(broadcastId = MessageFactoryHelper.getBroadcastId()) {
    return new CustomerIoGambitBroadcastMessage({
      data: {
        northstarId: MessageFactoryHelper.getFakeUserId(),
        broadcastId,
        mobile: MessageFactoryHelper.getFakeMobileNumber(),
      },
      meta: {},
    });
  }

  static getSmsActiveMessage() {
    return new CustomerIoSmsStatusActiveMessage({
      data: {
        northstarId: MessageFactoryHelper.getFakeUserId(),
      },
      meta: {},
    });
  }

  static getCustomerIoWebhookData() {
    return {
      data: {
        campaign_id: chance.integer({ min: 0 }),
        customer_id: MessageFactoryHelper.getFakeUserId(),
        email_address: chance.email(),
        email_id: chance.string({ length: 10 }),
        subject: chance.sentence({ words: 5 }),
        template_id: chance.integer({ min: 0 }),
      },
      event_id: chance.string({ length: 10 }),
      event_type: chance.word(),
      timestamp: chance.timestamp(),
    };
  }

  static getCustomerIoWebhookMessage(eventType, timestamp) {
    const data = MessageFactoryHelper.getCustomerIoWebhookData();
    data.event_type = eventType || chance.word();
    data.timestamp = timestamp || chance.timestamp();

    return new CustomerIoWebhookMessage({
      data,
      meta: {},
    });
  }
}

module.exports = MessageFactoryHelper;

// ------- End -----------------------------------------------------------------
