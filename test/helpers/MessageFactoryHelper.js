'use strict';

// ------- Imports -------------------------------------------------------------

// Libraries
const Chance = require('chance');
const moment = require('moment');

// App modules
const CustomerIoUpdateCustomerMessage = require('../../src/messages/CustomerIoUpdateCustomerMessage');
const MdataMessage = require('../../src/messages/MdataMessage');
const UserMessage = require('../../src/messages/UserMessage');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

// ------- Helpers -------------------------------------------------------------

class MessageFactoryHelper {
  static getValidUser() {
    const fakeId = chance.hash({ length: 24 });
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
        mobile_status: chance.pickone([
          'undeliverable',
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
        updated_at: chance.date({ year: chance.year({ min: 2011, max: 2012 }) }).toISOString(),
        created_at: chance.date({ year: chance.year({ min: 2000, max: 2010 }) }).toISOString(),
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
          mobile_status: chance.pickone([
            'undeliverable',
            'active',
            'unknown',
            null,
            undefined,
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
          subscribed_at: chance.timestamp(),
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
}

module.exports = MessageFactoryHelper;

// ------- End -----------------------------------------------------------------
