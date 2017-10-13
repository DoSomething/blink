'use strict';

const CampaignSignupMessage = require('../messages/CampaignSignupMessage');
const Queue = require('./Queue');

class GambitCampaignSignupRelayQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = CampaignSignupMessage;
    this.routes.push('signup.user.event');
  }
}

module.exports = GambitCampaignSignupRelayQ;
