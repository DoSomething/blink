'use strict';

const FetchMessage = require('../messages/FetchMessage');
const Queue = require('../lib/Queue');

class FetchQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = FetchMessage;
  }
}

module.exports = FetchQ;
