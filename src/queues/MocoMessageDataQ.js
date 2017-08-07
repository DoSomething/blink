'use strict';

const FreeFormMessage = require('../messages/FreeFormMessage');
const Queue = require('./Queue');

class MocoMessageDataQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = FreeFormMessage;
  }
}

module.exports = MocoMessageDataQ;
