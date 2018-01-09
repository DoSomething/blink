'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const Message = require('../../../src/messages/Message');

// ------- Init ----------------------------------------------------------------

chai.should();

// ------- Tests ---------------------------------------------------------------

/**
 * Message.heuristicMessageFactory()
 */
test('Message.heuristicMessageFactory(): Should correctly detect concrete message classes', () => {
  class CustomMessageClass extends Message {
    // Dummy method to ensure it's callable when the class is instantiated heuristically.
    myConcreteMethod() { return this.getData(); }
  }
  const customMessage = CustomMessageClass.heuristicMessageFactory({});
  customMessage.should.be.an.instanceof(CustomMessageClass);
  customMessage.should.be.an.instanceof(Message);
  customMessage.should.respondTo('myConcreteMethod');
});

// ------- End -----------------------------------------------------------------
