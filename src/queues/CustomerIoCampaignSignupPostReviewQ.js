'use strict';

const CampaignSignupPostReviewMessage = require('../messages/CampaignSignupPostReviewMessage');
const Queue = require('../lib/Queue');

class CustomerIoCampaignSignupPostReviewQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CampaignSignupPostReviewMessage;
    this.routes.push('signup-post-review.user.event');
  }
}

module.exports = CustomerIoCampaignSignupPostReviewQ;
