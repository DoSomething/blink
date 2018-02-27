'use strict';

const CampaignSignupPostMessage = require('./CampaignSignupPostMessage');

class CampaignSignupPostReviewMessage extends CampaignSignupPostMessage {
  constructor(...args) {
    super(...args);
    /**
     * TODO: adding this eventName property is not ideal. Since this property is only important for
     * Messages that are going to end up being transformed to C.io events. Ideally, we should
     * have an intermediate class called CustomerIoEventMessage and extend from it.
     */
    this.eventName = 'campaign_review';
  }
}

module.exports = CampaignSignupPostReviewMessage;
