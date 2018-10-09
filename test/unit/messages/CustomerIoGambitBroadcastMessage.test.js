'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const CustomerIoGambitBroadcastMessage = require('../../../src/messages/CustomerIoGambitBroadcastMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');


// ------- Init ----------------------------------------------------------------

chai.should();
const generator = MessageFactoryHelper.getGambitBroadcastMessage;

// ------- Tests ---------------------------------------------------------------

test('Gambit Broadcast message generator', () => {
  generator().should.be.an.instanceof(CustomerIoGambitBroadcastMessage);
});

// ------- End -----------------------------------------------------------------
