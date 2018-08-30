'use strict';

const fetch = require('node-fetch');
const logger = require('winston');

const Worker = require('./Worker');

class FetchWorker extends Worker {
  setup() {
    super.setup({
      queue: this.blink.queues.fetchQ,
    });
  }

  async consume(fetchMessage) {
    const { url, options } = fetchMessage.getData();
    const response = await fetch(url, options);
    if (response.status === 200) {
      this.log(
        'debug',
        fetchMessage,
        response,
        'success_fetch_response_200',
      );
      return true;
    }

    // Todo: retry when 500?
    this.log(
      'warning',
      fetchMessage,
      response,
      'error_fetch_response_not_200',
    );
    return false;
  }

  // TODO: All other workers have moved on from async "cleaning the Body". Let's clean this up!
  async log(level, message, response, code = 'unexpected_code') {
    const cleanedBody = (await response.text()).replace(/\n/g, '\\n');

    const meta = {
      // Todo: log env
      code,
      worker: this.constructor.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
      response_status: response.status,
      response_status_text: `"${response.statusText}"`,
    };
    // Todo: log error?

    logger.log(level, cleanedBody, meta);
  }
}

module.exports = FetchWorker;
