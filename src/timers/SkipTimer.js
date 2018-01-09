'use strict';

// ------- Imports -------------------------------------------------------------

const logger = require('winston');

// ------- Internal imports ----------------------------------------------------

const BlinkError = require('../errors/BlinkError');
const Timer = require('./Timer');

// ------- Class ---------------------------------------------------------------

/**
 * Skip timer: skips scheduled ticks until running tick isn't completed
 */
class SkipTimer extends Timer {
  constructor(blink) {
    super();

    // Expose app and its config.
    this.blink = blink;
    // Timer name.
    this.timerName = this.constructor.name;
    // Ensures tick has access to `this` object.
    this.tick = this.tick.bind(this);
    // Counts ticks.
    this.tickCounter = 0;
    // IntervalId.
    this.intervalId = false;
    // Execution lock.
    this.lock = false;
    // Default delay, 1000ms.
    this.delay = 1000;
  }

  setup({ delay = false }) {
    // Allow overriding delay.
    if (Number.isInteger(delay) && delay > 0) {
      this.delay = delay;
    }
    this.logInternal('debug', `Internal delay set to ${delay}ms`, 'debug_skip_timer_delay_set');

    if (!this.run) {
      throw new BlinkError(`${this.timerName} should implement run() method`);
    }
    // Bind `run` method to timer context, so it has access to `this`.
    this.run = this.run.bind(this);
  }

  start() {
    if (!this.tick || !this.delay || !this.run) {
      throw new BlinkError('You need to run Timer.setup() before Timer.start()');
    }
    this.intervalId = setInterval(this.tick, this.delay);
  }

  stop() {
    clearInterval(this.intervalId);
  }

  async tick() {
    if (this.lock) {
      // Todo: log when to many ticks skipped?
      return false;
    }
    this.lock = true;
    this.tickCounter += 1;
    await this.run(this.tickCounter);
    this.lock = false;
    return true;
  }

  logInternal(level, message, code) {
    const meta = {
      env: this.blink.config.app.env,
      code,
      timer: this.timerName,
    };
    logger.log(level, message, meta);
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = SkipTimer;

// ------- End -----------------------------------------------------------------
