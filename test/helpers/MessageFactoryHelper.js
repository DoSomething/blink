'use strict';

// ------- Imports -------------------------------------------------------------

// Libraries
const Chance = require('chance');
const moment = require('moment');

// App modules
const CampaignSignupMessage = require('../../src/messages/CampaignSignupMessage');
const CampaignSignupPostMessage = require('../../src/messages/CampaignSignupPostMessage');
const CustomerIoUpdateCustomerMessage = require('../../src/messages/CustomerIoUpdateCustomerMessage');
const MdataMessage = require('../../src/messages/MdataMessage');
const TwilioStatusCallbackMessage = require('../../src/messages/TwilioStatusCallbackMessage');
const UserMessage = require('../../src/messages/UserMessage');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

// ------- Helpers -------------------------------------------------------------

class MessageFactoryHelper {
  static getValidUser() {
    const fakeId = chance.hash({ length: 24 });
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
    const fakeId = chance.hash({ length: 24 });
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

  static getValidMdata() {
    // TODO: randomize
    return new MdataMessage({
      data: {
        phone: '15555225222',
        carrier: 'tmobile',
        profile_id: '167181555',
        profile_first_name: 'Sergii',
        profile_last_name: 'Tkachenko',
        profile_email: 'sergii+test-blink@dosomething.org',
        profile_street1: 'FL 1',
        profile_street2: '',
        profile_city: 'New York',
        profile_state: 'NY',
        profile_postal_code: '10010',
        profile_age: '',
        profile_birthdate: '2000-01-01',
        profile_birthyear: '',
        profile_cause: '',
        profile_college_gradyear: '',
        profile_ctd_completed: '',
        profile_ctd_day1: '',
        profile_ctd_day2: '',
        profile_ctd_day3: '',
        profile_ctd_start: '',
        profile_date_of_birth: '2000-01-01',
        profile_edutype: '',
        profile_gambit_chatbot_response: 'Hi it\'s Freddie from DoSomething...',
        profile_sfw_day3: '',
        profile_source: 'Niche',
        profile_texting_frequency: '',
        args: '',
        keyword: 'BLINKMEUP',
        timestamp: '2017-04-19T13:35:56Z',
        message_id: '841415468',
        mdata_id: '14372',
        mms_image_url: '',
        phone_number_without_country_code: '15555225222',
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

    const data = {
      // Required
      id: chance.integer({ min: 0 }),
      signup_id: chance.integer({ min: 0 }),
      northstar_id: chance.hash({ length: 24 }),
      campaign_id: chance.string({ length: 4, pool: '1234567890' }),
      campaign_run_id: chance.string({ length: 4, pool: '1234567890' }),
      quantity: chance.integer({ min: 0 }),

      // Optional
      source: chance.pickone(['campaigns', 'phoenix-web']),
      caption: chance.sentence({ words: 5 }),
      why_participated: chance.sentence(),
      url: chance.avatar({ protocol: 'https' }),

      // Timestamps
      created_at: createdAt,
      updatead_at: updatedAt,
      deleted_at: null,
    };

    // Optional, may be empty.
    const optionalFields = [
      'source',
      'caption',
      'why_participated',
      'url',
    ];
    optionalFields.forEach((key) => {
      if (chance.bool({ likelihood: 40 })) {
        delete data[key];
      }
    });

    return new CampaignSignupPostMessage({
      data,
      meta: {},
    });
  }
}

module.exports = MessageFactoryHelper;

// ------- End -----------------------------------------------------------------
