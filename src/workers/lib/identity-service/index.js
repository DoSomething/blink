'use strict';

const config = require('../../../../config/workers/lib/identity-service');
const ClientCredentialsStrategy = require('./auth-strategies/client-credentials');

function getNewClientCredentialsStrategy() {
  return ClientCredentialsStrategy.getNewInstance({
    tokenConfig: {
      scope: config.authStrategies.clientCredentials.scopes,
    },
  });
}

/**
 * NorthstarClient
 */
class IdentityService {
  /**
   * Create a new service client
   *
   * @param  {ClientCredentials|EventEmitter} [strategy=ClientCredentials] - Auth strategy
   * @param  {Function} strategy.setup - Start the strategy state
   * @param  {Function} strategy.getAuthHeader - Returns the Authorization header w/ valid token
   */
  constructor(strategy = getNewClientCredentialsStrategy()) {
    this.strategy = strategy;
    this.config = config;
    this.ready = this.strategy.setup();
  }
  /**
   * getAuthHeader - Gets the Authorization header by the strategy sent in the strategyName
   * argument. Each strategy MUST implement the getAuthHeader method.
   *
   * @async
   * @return {Promise<Object>} Authorization headers
   */
  async getAuthHeader() {
    // Check to make sure the strategy.setup has completed setting up
    await this.ready;
    return this.strategy.getAuthHeader();
  }
}

module.exports = IdentityService;
