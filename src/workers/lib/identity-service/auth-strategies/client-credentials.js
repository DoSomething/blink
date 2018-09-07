'use strict';

const oauth2 = require('simple-oauth2');
const logger = require('../../../../../config/logger');
const EventEmitter = require('events');
const differenceInSeconds = require('date-fns/difference_in_seconds');

const config = require('../../../../../config/workers/lib/identity-service').authStrategies.clientCredentials;

/**
 * ClientCredentials
 * @extends EventEmitter
 */
class ClientCredentials extends EventEmitter {
  /**
   * Create a new client credentials flow strategy
   *
   * @param  {Object} opts = {}
   */
  constructor(opts = {}) {
    super();
    // Amount of milliseconds to wait before checking if we need to renew the token
    this.tickerInterval = opts.tickerInterval || config.defaults.tickerInterval;
    /**
     * If we can't renew the token in maxReconnectAttempts retries, wait this many milliseconds
     * before trying to reconnect again
     */
    this.reconnectWaitPeriod = opts.reconnectWaitPeriod || config.defaults.reconnectWaitPeriod;
    /**
     * Should the token be preemptively renewed?
     * In the case of Northstar we Should, because it sends 'expires_in' instead of 'expires_at'
     * generating a possible race condition. Described below.
     * @see https://www.npmjs.com/package/simple-oauth2#access-token-object
     */
    this.autoRenewToken = opts.autoRenewToken || config.defaults.autoRenewToken;
    // How many seconds before the token expires we should attempt to renew?
    this.renewWindow = opts.renewWindow || config.defaults.renewWindow;
    // Maximum amount of linear retries to attemp before a waiting period
    this.maxReconnectAttempts = opts.maxReconnectAttempts || 1;
    // It increases on each attempt to reconnect
    this.reconnectAttempts = 0;
    /**
     * We might need in order to ask for specific scopes
     * @see https://github.com/lelylan/simple-oauth2/tree/013ddf2a3876c57c7b706599d8688f4bf48ea660#client-credentials-flow
     */
    this.tokenConfig = opts.tokenConfig || {};
    this.oauthClient = oauth2.create(config.credentials);
    // Used for testing
    this.setInterval = opts.setInterval || setInterval;
  }
  /**
   * setup - Initializes the setup of the Oauth token and sets listeners to respond
   * to 'token-set' and 'token-error' events.
   *
   * @return {Promise}
   */
  setup() {
    // token-set listener
    this.on('token-set', () => {
      logger.info('ClientCredentials strategy: new token has been set');
      // TODO: Maybe create a separate token refresh class that encapsulates renewing tokens.
      if (this.autoRenewToken && !this.ticker) {
        this.setTicker(this.renewExpiredToken.bind(this));
      }
      // Some cleanup, TODO: maybe move to cleanup method?
      this.reconnectAttempts = 0;
    });
    // token-error listener
    this.on('token-error', (error) => {
      logger.error(`ClientCredentials strategy: Access Token Error. Error Message: ${error.message}`);
      this.reconnect();
    });

    // Get and set new token
    return this.renewToken();
  }
  /**
   * getAuthHeader - Returns the Authorization header and Bearer token.
   *
   * @return {Object}
   */
  getAuthHeader() {
    return {
      Authorization: `Bearer ${this.token.access_token}`,
    };
  }
  /**
   * @static getNewInstance
   *
   * @param  {object} opts = {}
   * @return {ClientCredentials}
   */
  static getNewInstance(opts = {}) {
    return new ClientCredentials(opts);
  }

  /**
   * If JS had private scope, the following methods would be private. -----------------------------\
   * There is hope: @see https://github.com/tc39/proposal-private-methods
   */

  /**
   * setToken - sets the token and fires the token-set event.
   *
   * @param  {Object} accessToken
   */
  setToken(accessToken) {
    this.token = accessToken.token;
    this.emit('token-set', this.token);
  }
  /**
   * renewExpiredToken - It checks if the stored token expiration window
   *                     (seconds left before expiration) is less than the renewal window value.
   *                     If it is, proceed to renew the token.
   */
  renewExpiredToken() {
    const expirationWindow = differenceInSeconds(this.token.expires_at, new Date());
    if (expirationWindow < this.renewWindow) {
      logger.info('ClientCredentials.renewExpiredToken: Renewing token');
      this.clearTicker();
      this.renewToken();
    }
  }
  /**
   * setTicker - Initializes an timer that will execute the callback every
   *             this.tickerInterval seconds. It sets the timer's id in the state for later
   *             invalidation.
   *
   * @param  {Function} cb  callback
   */
  setTicker(cb) {
    this.ticker = setInterval(cb, this.tickerInterval);
  }
  /**
   * clearTicker - It immediately clears the timer and sets the timer state to undefined.
   */
  clearTicker() {
    // Stop interval as soon as possible
    process.nextTick(() => {
      clearInterval(this.ticker);
      this.ticker = undefined;
    });
  }
  /**
   * reconnect - Handles reconnection logic when fired in the `token-error` event. It records the
   *             amount of times it tries to renew the token. If the amount of times exceeds the max
   *             attempts allowed, it sets a timer to start trying again in x amount
   *             of seconds later.
   */
  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts += 1;
      this.renewToken();
      logger.warn(`ClientCredentials.reconnect: reconnecting attempt #${this.reconnectAttempts}`);
    } else {
      logger.warn(`ClientCredentials.reconnect: retries exhausted, waiting ${this.reconnectWaitPeriod / 1000} seconds`);
      setTimeout(() => {
        this.reconnectAttempts = 0;
        this.renewToken();
      }, this.reconnectWaitPeriod);
    }
  }
  /**
   * getAccessToken
   *
   * @async
   * @return {Promise}
   */
  async getAccessToken() {
    const token = await this.requestToken();
    return this.oauthClient.accessToken.create(token);
  }
  /**
   * async renewToken - fetches a new OAuth token.
   *
   * @return {Promise}
   */
  async renewToken() {
    try {
      const accessToken = await this.getAccessToken();
      this.setToken(accessToken);
    } catch (error) {
      this.emit('token-error', error);
    }
  }

  requestToken() {
    return this.oauthClient.clientCredentials.getToken(this.tokenConfig);
  }

  // End "private" methods ------------------------------------------------------------------------/
}

module.exports = ClientCredentials;
