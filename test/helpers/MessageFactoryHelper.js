'use strict';

// ------- Imports -------------------------------------------------------------

const Chance = require('chance');
const moment = require('moment');

const CampaignSignupMessage = require('../../src/messages/CampaignSignupMessage');
const CampaignSignupPostMessage = require('../../src/messages/CampaignSignupPostMessage');
const CustomerIoUpdateCustomerMessage = require('../../src/messages/CustomerIoUpdateCustomerMessage');
const FreeFormMessage = require('../../src/messages/FreeFormMessage');
const TwilioStatusCallbackMessage = require('../../src/messages/TwilioStatusCallbackMessage');
const UserMessage = require('../../src/messages/UserMessage');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

// ------- Helpers -------------------------------------------------------------

class MessageFactoryHelper {
  static getValidUser() {
    const fakeId = MessageFactoryHelper.getFakeUserId();
    const createdAt = chance.date({ year: chance.year({ min: 2000, max: 2010 }) }).toISOString();
    return new UserMessage({
      data: {
        id: fakeId,
        _id: fakeId,
        first_name: chance.first(),
        last_name: chance.last(),
        last_initial: chance.character({ alpha: true }),
        photo: chance.url({ extensions: ['gif', 'jpg', 'png'] }),
        email: chance.email(),
        mobile: `+1555${chance.string({ length: 7, pool: '1234567890' })}`,
        facebook_id: chance.fbid().toString(),
        interests: chance.n(chance.word, chance.natural({ min: 0, max: 20 })),
        birthdate: moment(chance.birthday({ type: 'teen' })).format('YYYY-MM-DD'),
        addr_street1: chance.address(),
        addr_street2: `Apt ${chance.natural({ min: 1, max: 20 })}`,
        addr_city: chance.city(),
        addr_state: chance.state({ territories: true }),
        addr_zip: chance.zip(),
        source: chance.pickone(['niche', 'phoenix', 'after_school']),
        source_detail: chance.word(),
        slack_id: chance.natural().toString(),
        mobilecommons_id: chance.natural().toString(),
        parse_installation_ids: chance.n(chance.guid, 2),
        sms_status: chance.pickone([
          'undeliverable',
          'less',
          'active',
          'unknown',
          'stop',
          null,
          undefined,
        ]),
        language: chance.locale({ region: false }),
        country: chance.country(),
        drupal_id: chance.natural().toString(),
        role: chance.pickone(['user', 'admin', 'staff']),
        // Dates are arbitrary, but it's make more sense when they are within
        // different ranges.
        last_authenticated_at: chance.date({
          year: chance.year({ min: 2013, max: 2015 }),
        }).toISOString(),
        updated_at: createdAt,
        created_at: createdAt,
      },
      meta: {},
    });
  }

  static getValidCustomerIoIdentify() {
    const fakeId = MessageFactoryHelper.getFakeUserId();
    return new CustomerIoUpdateCustomerMessage({
      data: {
        id: fakeId,
        data: {
          email: chance.email(),
          updated_at: chance.timestamp(),
          created_at: chance.timestamp(),
          sms_status: chance.pickone([
            'undeliverable',
            'active',
            'less',
            'unknown',
            'stop',
            null,
          ]),
          last_authenticated_at: chance.timestamp(),
          birthdate: moment(chance.birthday({ type: 'teen' })).format('YYYY-MM-DD'),
          facebook_id: chance.fbid().toString(),
          first_name: chance.first(),
          last_name: chance.last(),
          addr_city: chance.city(),
          addr_state: chance.state({ territories: true }),
          addr_zip: chance.zip(),
          source: chance.pickone(['niche', 'phoenix', 'after_school']),
          source_detail: chance.word(),
          language: chance.locale({ region: false }),
          country: chance.country(),
          unsubscribed: chance.bool(),
          role: chance.pickone(['user', 'admin', 'staff']),
          interests: chance.n(chance.word, chance.natural({ min: 0, max: 20 })),
        },
      },
      meta: {},
    });
  }

  static getValidMessageData() {
    // TODO: randomize
    const sid = `${chance.pickone(['SM', 'MM'])}${chance.hash({ length: 32 })}`;
    return new TwilioStatusCallbackMessage({
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
        From: `+1555${chance.string({ length: 7, pool: '1234567890' })}`,
        MediaUrl0: chance.avatar({ protocol: 'https' }),
        ApiVersion: '2010-04-01',
      },
      meta: {},
    });
  }

  static getValidCampaignSignup() {
    const createdAt = chance.date({ year: (new Date()).getFullYear() }).toISOString();
    const updatedAt = moment(createdAt).add(1, 'days').toISOString();

    return new CampaignSignupMessage({
      data: {
        id: chance.integer({ min: 0 }),
        northstar_id: chance.hash({ length: 24 }),
        campaign_id: chance.string({ length: 4, pool: '1234567890' }),
        campaign_run_id: chance.string({ length: 4, pool: '1234567890' }),
        quantity: null,
        why_participated: null,
        // Don't add sms signup here, they are tested separately.
        source: chance.pickone(['campaigns', 'phoenix-web']),
        created_at: createdAt,
        updated_at: updatedAt,
      },
      meta: {},
    });
  }

  static getValidCampaignSignupPost() {
    const createdAt = chance.date({ year: (new Date()).getFullYear() }).toISOString();
    const updatedAt = moment(createdAt).add(1, 'days').toISOString();
    const deletedAt = moment(createdAt).add(2, 'days').toISOString();

    const data = {
      // Required minimum
      id: chance.integer({ min: 0 }),
      signup_id: chance.integer({ min: 0 }),
      northstar_id: chance.hash({ length: 24 }),
      campaign_id: chance.string({ length: 4, pool: '1234567890' }),
      type: chance.pickone(['photo', 'voter-reg']),
      action: chance.pickone(['january2018-turbovote', 'january-submit-photo']),
      created_at: createdAt,

      // Optional / nullable
      campaign_run_id: chance.pickone([null, chance.integer({ min: 0 })]),
      source: chance.pickone([null, 'campaigns', 'phoenix-web']),
      media: chance.pickone([null, {
        url: chance.avatar({ protocol: 'https' }),
        caption: chance.sentence({ words: 5 }),
      }]),
      why_participated: chance.pickone([null, chance.sentence()]),
      updated_at: chance.pickone([null, updatedAt]),
      deleted_at: chance.pickone([null, deletedAt]),
      details: chance.pickone([null, { random: 'stuff' }]),
      remote_addr: chance.pickone([null, chance.ip()]),
      tags: chance.pickone([null, [], ['stuff', 'more-stuff']]),
      status: chance.pickone([null, 'pending']),
      quantity: chance.pickone([null, chance.integer({
        min: 1, max: 10,
      })]),
    };

    return new CampaignSignupPostMessage({
      data,
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

  static getFakeMobileNumber() {
    const result = `+1555${chance.string({ length: 7, pool: '1234567890' })}`;
    return result;
  }

  static getFakeUserId() {
    const result = chance.hash({ length: 24 });
    return result;
  }

  static getValidCustomerBroadcastData(broadcastId) {
    const data = {
      To: MessageFactoryHelper.getFakeMobileNumber(),
      Body: chance.sentence(),
      StatusCallback: `http://blink:password@blink.dosomething.org/api/v1/webhooks/twilio-sms-broadcast?broadcastId=${broadcastId}`,
    };
    return data;
  }

  static getValidGambitBroadcastData(broadcastId) {
    const data = {
      northstarId: MessageFactoryHelper.getFakeUserId(),
      broadcastId,
    };
    return data;
  }
}

module.exports = MessageFactoryHelper;

// ------- End -----------------------------------------------------------------
