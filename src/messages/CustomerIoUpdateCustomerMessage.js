'use strict';

const moment = require('moment');

const Message = require('./Message');

// TODO: Move this to be a Model. See CustomerIoEvent as an example.
class CustomerIoUpdateCustomerMessage extends Message {
  /**
   * TODO: This message should have a toCustomerIoEvent method like CampaignSignupPostMessage
   * and return a CustomerIoEvent instance for consistency.
   *
   * @static fromUser - C.io segmentation filters distinguish
   * between String, Number, and Date types. Because of this,
   * we need to make sure the event properties, when passed,
   * should be casted to the appropriate type for successful
   * segmenting in C.io.
   *
   * @param  {UserMessage} userMessage
   * @return {CustomerIoUpdateCustomerMessage}
   */
  static fromUser(userMessage) {
    const user = userMessage.getData();

    // last_messaged_at is not included because it's already being sent as an unix timestamp
    const dates = ['created_at', 'updated_at', 'last_authenticated_at'];

    // Copy user fields.
    const customerData = Object.assign({}, user);
    // Remove id from data, as it's available on the top level.
    delete customerData.id;

    // Rename mobile to phone
    if (customerData.mobile) {
      customerData.phone = customerData.mobile;
      delete customerData.mobile;
    }

    // Cast dates into unix timestamp if the value is a ISO_8601 string, otherwise cast to Number.
    dates.forEach((dateKey) => {
      const dateValue = customerData[dateKey];
      // value exists
      if (dateValue) {
        customerData[dateKey] = !Number(dateValue) ?
          moment(dateValue, moment.ISO_8601).unix() :
          Number(dateValue);
      }
    });

    /**
     * TODO: Blink shouldn't have to figure out if the user is unsubscribed or not.
     * This should come from the source, in this case Northstar.
     * @see https://github.com/DoSomething/northstar/pull/706
     *
     * If a user is newly created (created_at & updated_at are the same)
     * then set them as "subscribed" to emails in Customer.io!
     */
    const isNew = customerData.created_at === customerData.updated_at;
    if (customerData.email && isNew) {
      customerData.unsubscribed = false;
    }

    const customerIoUpdateCustomerMessage = new CustomerIoUpdateCustomerMessage({
      data: {
        id: user.id,
        data: customerData,
      },
      meta: {
        request_id: userMessage.getRequestId(),
      },
    });
    return customerIoUpdateCustomerMessage;
  }
}

module.exports = CustomerIoUpdateCustomerMessage;
