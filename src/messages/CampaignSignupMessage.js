'use strict';

const CustomerIoEvent = require('../models/CustomerIoEvent');
const Message = require('./Message');
const schema = require('../validations/campaignSignup');

class CampaignSignupMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    this.schema = schema;
    this.eventName = 'campaign_signup';
  }

  toCustomerIoEvent() {
    const data = this.getData();
    data.signup_id = data.id;

    const event = new CustomerIoEvent(
      data.northstar_id,
      this.eventName,
      data,
    );

    // Signup -> customer.io event transformation would only happen in this class.
    // It's safe to hardcode schema event version here.
    // Please bump it this when data schema changes.
    event.setVersion(2);
    return event;
  }
}

module.exports = CampaignSignupMessage;
