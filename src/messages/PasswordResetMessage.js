'use strict';

const CustomerIoEvent = require('../models/CustomerIoEvent');
const Message = require('./Message');
const schema = require('../validations/passwordReset');

class PasswordResetMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    this.schema = schema;
    this.eventName = 'password_reset';
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
    const eventData = {
      type: data.type,
      url: data.url,
    };

    const event = new CustomerIoEvent(
      data.user_id,
      this.eventName,
      eventData,
    );
    // Password reset -> customer.io event transformation would only happen in this class.
    // It's safe to hardcode schema event version here.
    // Please bump it this when data schema changes.
    event.setVersion(3);
    return event;
  }
}

module.exports = PasswordResetMessage;
