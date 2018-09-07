'use strict';

// ------- Imports -------------------------------------------------------------

const uuidV4 = require('uuid/v4');

// ------- Internal imports ----------------------------------------------------

const BlinkError = require('../errors/BlinkError');
const logger = require('../../config/logger');
const RedisRetryDelayer = require('../lib/delayers/RedisRetryDelayer');
const RetryManager = require('../lib/RetryManager');

// ------- Class ---------------------------------------------------------------

class Worker {
  constructor(blink) {
    this.blink = blink;
    this.rateLimit = this.blink.config.app.rateLimit;
    this.messagsInMemoryLimit = this.blink.config.app.prefetchCount;
    this.workerName = this.constructor.name;
    // TODO: get from dyno?
    this.consumerName = `${this.workerName}-${uuidV4()}`;
  }

  setup({ queue, rateLimit = false }) {
    const intRateLimit = parseInt(rateLimit, 10);

    if (!queue) {
      throw new BlinkError('Queue must be provided to Worker.setup()');
    }
    this.queue = queue;

    // Ensure consume method exists and bound it to the object context
    // to preserve access to `this` in it.
    if (!this.consume) {
      throw new BlinkError(`${this.workerName} should implement consume() method`);
    }
    this.consume = this.consume.bind(this);

    // Allow overriding rateLimit.
    if (Number.isInteger(intRateLimit) && intRateLimit > 0) {
      this.rateLimit = intRateLimit;
    }
    this.logInternal('debug', `Rate limit set to ${this.rateLimit}`, 'debug_rate_limit_set');

    // Initialize ioredis for the delay infrastructure.
    this.retryDelayer = new RedisRetryDelayer(
      this.blink.redis.getClient(),
      this.blink.redis.settings,
    );

    // Setup retry manager to handle BlinkRetryErrors.
    this.retryManager = new RetryManager(this.queue, this.retryDelayer);
  }

  async start() {
    if (!this.queue || !this.retryManager) {
      throw new BlinkError('You need to run Worker.setup() before Worker.start()');
    }

    // Limit the number of messages simultaneously loaded into
    // worker's memory to avoid reaching memory limit.
    await this.limitMessagesInMemory(this.messagsInMemoryLimit);

    // Prepare optioons.
    const rateLimit = this.rateLimit;
    const retryManager = this.retryManager;
    const consumerName = this.consumerName;

    // Subscribe this.consume to listening for new messages in the queue.s
    const consumerTag = await this.queue.subscribe(
      this.consume,
      { rateLimit, retryManager, consumerName },
    );

    // returned consumerTag should be the same as consumerName
    this.logInternal(
      'info',
      `Listening for messages in "${this.queue.name}" queue as ${consumerTag}`,
      'success_worker_start',
    );
  }

  async limitMessagesInMemory(prefetchCount) {
    this.logInternal(
      'debug',
      `Limiting messages in memory to ${prefetchCount}`,
      'debug_prefetch_count_set',
    );

    // WARNING: only compatible with RabbitMQ.
    // TODO: Make sure this is abstracted out.
    // Workers shouldn't know internal specifics of brokers.
    // Might make sense to set it before App.start().
    return this.blink.broker.getChannel().prefetch(prefetchCount);
  }

  logInternal(level, message, code) {
    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.constructor.name,
    };
    logger.log(level, message, { meta });
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = Worker;

// ------- End -----------------------------------------------------------------
