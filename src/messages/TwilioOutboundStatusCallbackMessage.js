'use strict';

const FreeFormMessage = require('./FreeFormMessage');

class TwilioOutboundStatusCallbackMessage extends FreeFormMessage {
  isError() {
    return !!this.getData().ErrorCode;
  }
  isDelivered() {
    return this.getData().MessageStatus === 'delivered';
  }
  setDeliveredAt(date) {
    this.payload.data.deliveredAt = date;
  }
  setFailedAt(date) {
    this.payload.data.failedAt = date;
  }
}

module.exports = TwilioOutboundStatusCallbackMessage;
