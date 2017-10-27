'use strict';

const CampaignSignupPostMessage = require('../messages/CampaignSignupPostMessage');
const Queue = require('../lib/Queue');

class CustomerIoCampaignSignupPostQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CampaignSignupPostMessage;
    this.routes.push('signup-post.user.event');
  }
}

module.exports = CustomerIoCampaignSignupPostQ;
