'use strict';

const moment = require('moment');
const underscore = require('underscore');

const CustomerIoEvent = require('../models/CustomerIoEvent');
const Message = require('./Message');
const schema = require('../validations/campaignSignupPost');

class CampaignSignupPostMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    this.schema = schema;
  }

  /**
   * toCustomerIoEvent - C.io segmentation filters distinguish
   * between String, Number, and Date types. Because of this,
   * we need to make sure the event properties, when passed,
   * should be casted to the appropriate type for successful
   * segmenting in C.io.
   *
   * TODO: DRY out functionality that will be used with all C.io events
   *
   * @return {CustomerIoEvent}
   */
  toCustomerIoEvent() {
    const data = this.getData();

    /**
     * { cioKey: dataKey } Mappings
     *
     * cioKeys will be assigned dataKey's value and dataKeys will be deleted
     * from the final eventData Object
     */
    const cioKeys = {

      /**
       * The Rogue data object's `id` property, maps to the C.io's `signup_post_id`.
       * The final event posted to C.io contains a `signup_post_id` instead of
       * the original `id` property.
       */
      signup_post_id: 'id',
    };

    /**
     * Type corrections
     */
    const eventData = underscore.mapObject(data, (value, key) => {
      if (key === 'id' || key === 'signup_id') return String(value);
      if (key === 'quantity') return Number(value);
      if (key === 'created_at') return moment(value).unix();
      return value;
    });

    /**
     * Assign dataKey values to the corresponding cioKey
     * Remove dataKey from eventData
     */
    Object.keys(cioKeys).forEach((cioKey) => {
      const dataKey = cioKeys[cioKey];
      eventData[cioKey] = eventData[dataKey];
      delete eventData[dataKey];
    });

    const event = new CustomerIoEvent(
      data.northstar_id,
      'campaign_signup_post',
      eventData,
    );
    // Signup post -> customer.io event transformation would only happen in this class.
    // It's safe to hardcode schema event version here.
    // Please bump it this when data schema changes.
    event.setVersion(3);
    return event;
  }
}

module.exports = CampaignSignupPostMessage;
