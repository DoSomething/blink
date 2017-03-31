'use strict';

const Exchange = require('./Exchange');
const FetchQ = require('../queues/FetchQ');

class Initializer {
  constructor(config) {
    this.config = config;
  }

  async getExchange() {
    if (this.exchange) {
      return this.exchange;
    }
    const exchange = new Exchange(this.config.amqp);
    await exchange.setup();
    this.exchange = exchange;
    return exchange;
  }

  async getFetchQ() {
    if (this.fetchQ) {
      return this.fetchQ;
    }
    const exchange = await this.getExchange();

    const fetchQ = new FetchQ(exchange);
    await fetchQ.setup();
    this.fetchQ = fetchQ;
    return fetchQ;
  }

}

module.exports = Initializer;