'use strict';

// ------- Imports -------------------------------------------------------------

const Redis = require('ioredis');

// ------- Internal imports ----------------------------------------------------

const BlinkConnectionError = require('../errors/BlinkConnectionError');
const DelayLogic = require('./delayers/DelayLogic');
const logger = require('../../config/logger');

// ------- Class ---------------------------------------------------------------

class RedisConnectionManager {
  constructor({ connection = {}, settings = {} }) {
    this.redisConfig = connection;

    // Set default connection options.
    // Setup automatic reconnect.
    // Also, this will enable automatic resend of unfulfilled commands.
    // See https://github.com/luin/ioredis/tree/master/#auto-reconnect
    this.redisConfig.retryStrategy = DelayLogic.constantTimeDelay(1000);

    // The name of the sorted set used for delaying retried messages.
    // Note: make sure not to assign `settings` by reference, but copy its values.
    this.settings = {};
    this.settings.retrySet = settings.retrySet;
    this.settings.retrySetProcessLimit = settings.retrySetProcessLimit;

    // Bind function that use object context.
    // LogSuccess logs out connection debug info.
    this.logSuccess = this.logSuccess.bind(this);
    // LogRetryAttempt queries redis instance for retryAttempt number.
    this.logRetryAttempt = this.logRetryAttempt.bind(this);
  }

  // ------- Public API  -------------------------------------------------------

  /**
   * Create managed Redis connection.
   */
  async connect() {
    // Create Redis connection.
    // This will automatically initiate the connection.
    this.client = new Redis(this.redisConfig);

    // Attach event handles
    this.attachEventHandlers(this.client);

    // Test the connection by sending PING.
    const pingResult = await this.client.ping();
    if (pingResult !== 'PONG') {
      const wrappedError = new BlinkConnectionError(
        `Redis didn't resond expected PONG to PING. Response was: ${pingResult}`,
      );
      RedisConnectionManager.logFailure(wrappedError);
      return false;
    }

    // Everything's ready.
    return true;
  }

  async disconnect() {
    await this.client.disconnect();
  }

  getClient() {
    return this.client;
  }

  // ------- Static helpers  ---------------------------------------------------

  /**
   * Attaches logging to redis connection events.
   *
   * https://github.com/NodeRedis/node_redis#connection-and-other-events
   *
   * @param  {Redis} redis Redis instance
   */
  attachEventHandlers(client) {
    client.on('error', RedisConnectionManager.logFailure);
    client.on('connect', this.logSuccess);
    client.on('reconnecting', this.logRetryAttempt);
  }

  logSuccess() {
    const networkData = RedisConnectionManager.getNetworkData(this.client);
    logger.info('Redis connection created', {
      meta: {
        code: 'success_redis_connection_manager_connection_created',
        redis_local: `${networkData.localAddress}:${networkData.localPort}`,
        redis_remote: `${networkData.remoteAddress}:${networkData.remotePort}`,
      },
    });
  }

  logRetryAttempt() {
    // Log retry information.
    logger.debug(
      `Redis reconnect scheduled, attempt ${this.client.retryAttempts}`, {
        meta: {
          code: 'debug_redis_connection_manager_reconnect_scheduled',
        },
      },
    );
  }

  static logFailure(error) {
    logger.error(`Redis connection error: ${error}`, {
      meta: {
        code: 'error_redis_connection_manager_connection_failure',
      },
    });
  }

  static getNetworkData(redis) {
    // Instance of Duplex.
    const socket = redis.stream;
    return {
      localAddress: socket.localAddress,
      localPort: socket.localPort,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
    };
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = RedisConnectionManager;

// ------- End -----------------------------------------------------------------
