'use strict';

const CustomerIoTrackEventWorker = require('./CustomerIoTrackEventWorker');

class CustomerIoCampaignSignupWorker extends CustomerIoTrackEventWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoCampaignSignupQ,
      eventName: 'track_campaign_signup',
    });
  }
}

module.exports = CustomerIoCampaignSignupWorker;
