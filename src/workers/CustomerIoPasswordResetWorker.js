'use strict';

const CustomerIoTrackEventWorker = require('./CustomerIoTrackEventWorker');

class CustomerIoPasswordResetWorker extends CustomerIoTrackEventWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoPasswordResetQ,
      eventName: 'track_password_reset',
    });
  }
}

module.exports = CustomerIoPasswordResetWorker;
