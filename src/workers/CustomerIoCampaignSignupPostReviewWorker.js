'use strict';

const CustomerIoTrackEventWorker = require('./CustomerIoTrackEventWorker');

class CustomerIoCampaignSignupPostReviewWorker extends CustomerIoTrackEventWorker {
  setup() {
    super.setup({
      queue: this.blink.queues.customerIoCampaignSignupPostReviewQ,
      eventName: 'track_campaign_review',
    });
  }
}

module.exports = CustomerIoCampaignSignupPostReviewWorker;
