'use strict';

const FreeFormMessage = require('../messages/FreeFormMessage');
const Queue = require('./Queue');

class UserSignupPostEventQ extends Queue {
  constructor(...args) {
    super(...args);
    this.messageClass = FreeFormMessage;
    this.routes.push('signup-post.user.event');
  }
}

module.exports = UserSignupPostEventQ;
