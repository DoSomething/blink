'use strict';

const BlinkError = require('../errors/BlinkError');
const RedisRetriesRepublishTimerTask = require('../timers/RedisRetriesRepublishTimerTask');
const BlinkApp = require('./BlinkApp');

class BlinkTimerApp extends BlinkApp {
  constructor(config, name) {
    super(config);

    const timersMapping = BlinkTimerApp.getAvailableTimers();
    if (!timersMapping[name]) {
      throw new BlinkError(`Timer ${name} is not found`);
    }
    this.timer = new timersMapping[name](this);
    this.timersName = name;
  }

  async start() {
    const success = await super.start();
    if (success) {
      this.timer.setup();
      await this.timer.start();
    }
  }

  static getAvailableTimers() {
    return {
      'redis-retries-republish': RedisRetriesRepublishTimerTask,
    };
  }
}

module.exports = BlinkTimerApp;
