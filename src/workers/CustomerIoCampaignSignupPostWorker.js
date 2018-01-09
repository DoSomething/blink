'use strict';

const CustomerIoTrackEventWorker = require('./CustomerIoTrackEventWorker');

class CustomerIoCampaignSignupPostWorker extends CustomerIoTrackEventWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoCampaignSignupPostQ,
      eventName: 'track_campaign_signup_post',
    });
  }
}

module.exports = CustomerIoCampaignSignupPostWorker;
