'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const CustomerIoSmsStatusActiveMessage = require('../../../src/messages/CustomerIoSmsStatusActiveMessage');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');


// ------- Init ----------------------------------------------------------------

chai.should();
const generator = MessageFactoryHelper.getValidSmsActiveData;

// ------- Tests ---------------------------------------------------------------

test('Sms Active message generator', () => {
  generator().should.be.an.instanceof(CustomerIoSmsStatusActiveMessage);
});

// ------- End -----------------------------------------------------------------
