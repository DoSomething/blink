'use strict';

// ------- Lint exceptions -----------------------------------------------------

// We want this method to inherit from the interface.
/* eslint class-methods-use-this: ["error", { "exceptMethods": ["delayMessageRetry"] }] */

// ------- Internal imports ----------------------------------------------------

const RetryDelayer = require('./RetryDelayer');

// ------- Class ---------------------------------------------------------------

class InMemoryRetryDelayer extends RetryDelayer {
  /**
   * Holds the `message` in memory for `delayMs` milliseconds,
   * then republishes them to the `queue`.
   *
   * TODO: Explain all gotchas with this approach.
   *
   * @param  {Queue}   queue          The queue to return the message to
   * @param  {Message} message        The message
   * @param  {integer} delayMs        The delay, milliseconds
   * @return {boolean}                The result of the operation
   */
  async delayMessageRetry(queue, message, delayMs) {
    // Delay republish using timeout.
    // Note: this conflicts with prefetch_count functionality, see issue #70.
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // Discard original message.
    queue.nack(message);
    // Republish modified message.
    queue.publish(message);
    return true;
  }
}

// ------- Exports -------------------------------------------------------------

module.exports = InMemoryRetryDelayer;

// ------- End -----------------------------------------------------------------
