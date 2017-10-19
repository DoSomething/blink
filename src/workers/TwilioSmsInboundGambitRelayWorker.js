'use strict';

const fetch = require('node-fetch');
const logger = require('winston');

const BlinkRetryError = require('../errors/BlinkRetryError');
const Worker = require('./Worker');

class TwilioSmsInboundGambitRelayWorker extends Worker {
  constructor(blink) {
    super(blink);
    this.blink = blink;

    this.baseURL = this.blink.config.gambit.converationsBaseUrl;
    this.apiKey = this.blink.config.gambit.converationsApiKey;

    // Bind process method to queue context
    this.consume = this.consume.bind(this);
  }

  setup() {
    this.queue = this.blink.queues.twilioSmsInboundGambitRelayQ;
  }

  async consume(message) {
    const body = JSON.stringify(message.getData());
    const headers = this.getRequestHeaders(message);
    const response = await fetch(
      `${this.baseURL}/receive-message`,
      {
        method: 'POST',
        headers,
        body,
      },
    );

    if (response.status === 200) {
      this.log(
        'debug',
        message,
        response,
        'success_gambit_inbound_relay_response_200',
      );
      return true;
    }

    if (this.checkRetrySuppress(response)) {
      this.log(
        'debug',
        message,
        response,
        'success_gambit_inbound_relay_retry_suppress',
      );
      return true;
    }

    if (response.status === 422) {
      this.log(
        'warning',
        message,
        response,
        'error_gambit_inbound_relay_response_422',
      );
      return false;
    }


    this.log(
      'warning',
      message,
      response,
      'error_gambit_inbound_relay_response_not_200_retry',
    );

    throw new BlinkRetryError(
      `${response.status} ${response.statusText}`,
      message,
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

  getRequestHeaders(message) {
    const headers = {
      Authorization: `Basic ${this.apiKey}`,
      'X-Request-ID': message.getRequestId(),
      'Content-type': 'application/json',
    };

    if (message.getMeta().retry && message.getMeta().retry > 0) {
      headers['x-blink-retry-count'] = message.getMeta().retry;
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

module.exports = TwilioSmsInboundGambitRelayWorker;
