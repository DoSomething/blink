'use strict';

const MdataMessage = require('../messages/MdataMessage');
const Queue = require('../lib/Queue');

class GambitChatbotMdataQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = MdataMessage;
  }
}

module.exports = GambitChatbotMdataQ;
