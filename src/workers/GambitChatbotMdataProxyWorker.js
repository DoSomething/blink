'use strict';

require('isomorphic-fetch');
const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
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
        meta,
      );
      this.blink.exchange.limitConsumerPrefetchCount(this.proxyConcurrency);
    }
    this.queue = this.blink.queues.gambitChatbotMdataQ;
  }

  async consume(mdataMessage) {
    const body = JSON.stringify(mdataMessage.getData());
    const headers = this.getRequestHeaders(mdataMessage);

    const response = await fetch(
      `${this.gambitBaseUrl}/chatbot`,
      {
        method: 'POST',
        headers,
        body,
      },
    );

    if (response.status === 200) {
      this.log(
        'debug',
        mdataMessage,
        response,
        'success_gambit_proxy_response_200',
      );
      return true;
    }

    if (this.checkRetrySuppress(response)) {
      this.log(
        'debug',
        mdataMessage,
        response,
        'success_gambit_proxy_retry_suppress',
      );
      return true;
    }

    if (response.status === 422) {
      this.log(
        'warning',
        mdataMessage,
        response,
        'error_gambit_proxy_response_422',
      );
      return false;
    }


    this.log(
      'warning',
      mdataMessage,
      response,
      'error_gambit_proxy_response_not_200_retry',
    );

    throw new BlinkRetryError(
      `${response.status} ${response.statusText}`,
      mdataMessage,
    );
  }

  async log(level, message, response, code = 'unexpected_code') {
    const cleanedBody = (await response.text()).replace(/\n/g, '\\n');

    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.constructor.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
      response_status: response.status,
      response_status_text: `"${response.statusText}"`,
    };
    // Todo: log error?
    logger.log(level, cleanedBody, meta);
  }

  getRequestHeaders(mdataMessage) {
    const headers = {
      'x-gambit-api-key': this.gambitApiKey,
      'X-Request-ID': mdataMessage.getRequestId(),
      'Content-type': 'application/json',
    };

    if (mdataMessage.getMeta().retry && mdataMessage.getMeta().retry > 0) {
      headers['x-blink-retry-count'] = mdataMessage.getMeta().retry;
    }

    return headers;
  }

  checkRetrySuppress(response) {
    // TODO: create common helper
    const headerResult = response.headers.get(this.blink.config.app.retrySuppressHeader);
    if (!headerResult) {
      return false;
    }
    return headerResult.toLowerCase() === 'true';
  }
}

module.exports = GambitChatbotMdataProxyWorker;
