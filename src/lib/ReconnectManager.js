'use strict';

// It's completely legit approach to use await inside loops in this specific case.
// See https://eslint.org/docs/rules/no-await-in-loop:
// > When Not To Use It:
// > Loops may be used to retry asynchronous operations that were unsuccessful.
// > In such cases it makes sense to use await within a loop and it is
// > recommended to disable the rule via a standard ESLint disable comment.
/* eslint-disable no-await-in-loop */

// ------- Imports -------------------------------------------------------------

const logger = require('winston');

// ------- Internal imports ----------------------------------------------------

const DelayLogic = require('./DelayLogic');

// ------- Class ---------------------------------------------------------------

class ReconnectManager {
  constructor(reconnectDelayLogic = false) {
    // Reconnect attempt
    this.attempt = 0;
    // A signal to interrupt retries.
    this.interrupted = false;
    // Reconnect allowance.
    this.executionLock = false;

    // Reconnect delay logic.
    if (!reconnectDelayLogic || typeof reconnectDelayLogic !== 'function') {
      // Default constant time backoff, reconnect every 1 seconds
      this.getReconnectDelay = DelayLogic.constantTimeDelay(1000);
    } else {
      this.getReconnectDelay = reconnectDelayLogic;
    }
  }

  /**
   * Reconnect API
   * @param  {functuon} connectFunction The function to be called
   *
   * Connect function should:
   *  - be async
   *  - return true or false
   *  - handle all underlying exceptions
   *
   * @return {[bool]} ConnectFunction's execution result
   */
  async reconnect(connectFunction) {
    // Indicate that reconnection in progress.
    this.executionLock = true;
    // No retry limit on reconnection.
    while (!this.interrupted) {
      const result = await connectFunction();
      if (result) {
        this.executionLock = false;
        return result;
      }

      this.attempt += 1;
      const delayMs = this.getReconnectDelay(this.attempt);
      ReconnectManager.logAttempt(this.attempt, delayMs);

      // Wait.
      await ReconnectManager.wait(delayMs);
    }
    // Execution has been interrrupted. Let know this.interrupt of clean finish.
    this.executionLock = false;
    return false;
  }

  async interrupt() {
    // We're connected, no need to interrupt antyhing.
    if (!this.executionLock) {
      return true;
    }
    // Request interruption.
    this.interrupted = true;
    // Wait for clean finish of this.reconnect().
    // Execution lock will be set to false on clean exit.
    while (this.executionLock) {
      const delayMs = this.getReconnectDelay(this.attempt);
      await ReconnectManager.wait(delayMs);
    }
    this.interrupted = false;
    return true;
  }

  static async wait(delayMs) {
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }

  static logAttempt(attempt, delayMs) {
    // Log retry information.
    logger.debug(
      `Reconnect scheduled in ${delayMs}ms, attempt ${attempt}`,
      {
        code: 'debug_reconnect_manager_reconnect_scheduled',
      },
    );
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = ReconnectManager;

// ------- End -----------------------------------------------------------------
