'use strict';

const CustomerIoEvent = require('../models/CustomerIoEvent');
const Message = require('./Message');
const schema = require('../validations/callToActionEmail');

class CallToActionEmailMessage extends Message {
  constructor(...args) {
    super(...args);
    // Data validation rules.
    this.schema = schema;
    this.eventName = 'call_to_action_email';
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
      actionText: data.actionText,
      actionUrl: data.actionUrl,
      intro: data.intro,
      outro: data.outro,
      subject: data.subject,
      type: data.type,
    };

    const event = new CustomerIoEvent(
      data.userId,
      this.eventName,
      eventData,
    );
    // Call to action email -> customer.io event transformation would only happen in this class.
    // It's safe to hardcode schema event version here.
    // Please bump it this when data schema changes.
    event.setVersion(3);
    return event;
  }
}

module.exports = CallToActionEmailMessage;
