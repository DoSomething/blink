'use strict';

const Queue = require('../lib/Queue');

class QuasarCustomerIoEmailActivityQ extends Queue {
  constructor(...args) {
    super(...args);
    this.routes.push('*.event.quasar');
  }
}

module.exports = QuasarCustomerIoEmailActivityQ;
