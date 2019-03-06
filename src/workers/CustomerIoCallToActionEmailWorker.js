'use strict';

const CustomerIoTrackEventWorker = require('./CustomerIoTrackEventWorker');

class CustomerIoCallToActionEmailWorker extends CustomerIoTrackEventWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoCallToActionEmailQ,
      eventName: 'track_call_to_action_email',
    });
  }
}

module.exports = CustomerIoCallToActionEmailWorker;
