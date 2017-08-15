'use strict';

const FreeFormMessage = require('../messages/FreeFormMessage');
const Queue = require('./Queue');

class UserSignupEventQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = FreeFormMessage;
    this.routes.push('signup.user.event');
  }
}

module.exports = UserSignupEventQ;
