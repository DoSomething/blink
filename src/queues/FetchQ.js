'use strict';

require('isomorphic-fetch');

const FetchMessage = require('../messages/FetchMessage');
const Queue = require('./Queue');

class FetchQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = FetchMessage;
  }
}

module.exports = FetchQ;
