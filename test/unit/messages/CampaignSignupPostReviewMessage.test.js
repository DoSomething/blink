'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const CampaignSignupPostReviewMessage = require('../../../src/messages/CampaignSignupPostReviewMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const generator = MessageFactoryHelper.getCampaignSignupPostMessageReviewMessage;

// ------- Tests ---------------------------------------------------------------

test('Campaign signup post message generator', () => {
  generator().should.be.an.instanceof(CampaignSignupPostReviewMessage);
});

test('Campaign signup post message should have toCustomerIoEvent', () => {
  generator().should.respondsTo('toCustomerIoEvent');
});

// ------- End -----------------------------------------------------------------
