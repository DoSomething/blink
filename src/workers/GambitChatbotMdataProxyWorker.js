'use strict';

const logger = require('winston');

const Worker = require('./Worker');

class GambitChatbotMdataProxyWorker extends Worker {

  constructor(blink) {
    super(blink);
    this.blink = blink;

    this.gambitBaseUrl = this.blink.config.gambit.baseUrl;
    this.gambitApiKey = this.blink.config.gambit.apiKey;
    this.proxyConcurrency = this.blink.config.gambit.proxyConcurrency;

    // Bind process method to queue context
    this.consume = this.consume.bind(this);
  }

  setup() {
    if (this.proxyConcurrency > 0) {
      const meta = {
        env: this.blink.config.app.env,
        code: 'gambit_concurrency_change',
        worker: this.constructor.name,
      };

      logger.debug(
        `Setting Gambit concurrency to ${this.proxyConcurrency}`,
        meta
      );
      this.blink.exchange.limitConsumerPrefetchCount(this.proxyConcurrency);
    }
    this.queue = this.blink.queues.gambitChatbotMdataQ;
  }

  async consume(mdataMessage) {
    const data = mdataMessage.payload.data;

    const url = `${this.gambitBaseUrl}/chatbot`;
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'x-gambit-api-key': this.gambitApiKey,
          'X-Request-ID': mdataMessage.payload.meta.request_id,
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (response.status === 200) {
      this.log(
        'debug',
        mdataMessage,
        response,
        'success_fetch_response_200'
      );
      return true;
    }

    // Todo: retry when 500?
    this.log(
      'warning',
      mdataMessage,
      response,
      'error_fetch_response_not_200'
    );
    return false;
  }

  async log(level, message, response, code = 'unexpected_code') {
    const cleanedBody = (await response.text()).replace(/\n/g, '\\n');

    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.constructor.name,
      request_id: message ? message.payload.meta.request_id : 'not_parsed',
      response_status: response.status,
      response_status_text: `"${response.statusText}"`,
    };
    // Todo: log error?

    logger.log(level, cleanedBody, meta);
  }
}

module.exports = GambitChatbotMdataProxyWorker;
