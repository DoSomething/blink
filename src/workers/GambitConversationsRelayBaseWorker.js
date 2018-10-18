'use strict';

const { STATUS_CODES } = require('http');


const BlinkRetryError = require('../errors/BlinkRetryError');
const logger = require('../../config/logger');
const Worker = require('./Worker');
const workerHelper = require('../lib/helpers/worker');

const logCodes = {
  retry: 'error_gambit_conversations_response_not_200_retry',
  success: 'success_gambit_conversations_response_200',
  suppress: 'success_gambit_conversations_retry_suppress',
  unprocessable: 'error_gambit_conversations_response_422',
};

/**
 * Represents a GambitConversationsRelay type of worker.
 * Workers that intend to relay messages to G-Conversations should inherit from this Worker.
 */
class GambitConversationsRelayBaseWorker extends Worker {
  setup({ queue, rateLimit }) {
    super.setup({ queue, rateLimit });
  }

  /**
   * handleResponse - Takes in a node-fetch response and determines if the request should be
   * retried, or logged.
   *
   * @param  {Object} message
   * @param  {Object} response node-fetch response
   * @return {boolean}
   */
  handleResponse(message, response) {
    if (workerHelper.shouldRetry(response)) {
      return this.logAndRetry(message, response.status);
    }

    /**
     * We should only go past this line if the response's status code does not trigger a retry.
     * Example: 200, 204, and 422
     * @see /config/app.js
     */

    if (workerHelper.checkRetrySuppress(response)) {
      return this.logSuppressedRetry(message, response.status);
    }
    return this.logResponse(message, response.status);
  }

  /**
   * logResponse
   *
   * @param  {Object} message
   * @param  {Object} response node-fetch response
   * @return {boolean}
   */
  logResponse(message, statusCode) {
    if (statusCode === 200 || statusCode === 204) {
      return this.logSuccess(message, statusCode);
    } else if (statusCode === 422) {
      return this.logUnprocessableEntity(message, statusCode);
    }
    return false;
  }

  logUnreachableGambitConversationsAndRetry(error, message) {
    workerHelper.logFetchFailureAndRetry(
      error.toString(),
      message,
      this.workerName,
      this.constructor.getLogCode('retry'),
    );
  }

  logAndRetry(message, statusCode, text) {
    this.log(
      'warning',
      message,
      statusCode,
      this.constructor.getLogCode('retry'),
      text,
    );

    throw new BlinkRetryError(
      `${statusCode} ${STATUS_CODES[statusCode]}`,
      message,
    );
  }

  /**
   * logSuccess
   *
   * @param  {Object} message
   * @param  {number} statusCode
   * @return {boolean}
   */
  logSuccess(message, statusCode, text) {
    this.log(
      'debug',
      message,
      statusCode,
      this.constructor.getLogCode('success'),
      text,
    );
    return true;
  }

  /**
   * logSuppressedRetry
   *
   * @param  {Object} message
   * @param  {number} statusCode
   * @return {boolean}
   */
  logSuppressedRetry(message, statusCode, text) {
    this.log(
      'debug',
      message,
      statusCode,
      this.constructor.getLogCode('suppress'),
      text,
    );
    return false;
  }

  /**
   * logUnprocessableEntity
   *
   * @param  {Object} message
   * @param  {number} statusCode
   * @return {boolean}
   */
  logUnprocessableEntity(message, statusCode, text) {
    this.log(
      'warning',
      message,
      statusCode,
      this.constructor.getLogCode('unprocessable'),
      text,
    );
    return false;
  }

  /**
   * log - description
   *
   * @param  {string} level                    log level
   * @param  {Object} message
   * @param  {number} statusCode               statusCode
   * @param  {string} code = 'unexpected_code'
   */
  log(level, message, statusCode, code = 'unexpected_code', logText = '') {
    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.workerName,
      request_id: message ? message.getRequestId() : 'not_parsed',
      response_status: statusCode,
      response_status_text: `"${STATUS_CODES[statusCode]}"`,
    };
    // Todo: log error?
    logger.log(level, logText, { meta });
  }

  static getLogCode(name) {
    return logCodes[name];
  }
}

module.exports = GambitConversationsRelayBaseWorker;
