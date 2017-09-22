'use strict';

const CustomerIoTrackEventWorker = require('./CustomerIoTrackEventWorker');

class CustomerIoCampaignSignupPostWorker extends CustomerIoTrackEventWorker {
  setup() {
    this.queue = this.blink.queues.customerIoCampaignSignupPostQ;
    this.eventName = 'track_campaign_signup_post';
  }
}

module.exports = CustomerIoCampaignSignupPostWorker;
