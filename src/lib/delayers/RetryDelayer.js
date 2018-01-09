'use strict';

// ------- Interface -----------------------------------------------------------

class RetryDelayer {
  /* eslint-disable no-unused-vars, class-methods-use-this */
  /* Next methods are interface methods declarations */

  /**
   * Schedules delay of `delayMs` milliseconds after which the message
   * with content `messageContent` will be redelivered to the `queue`.
   *
   * @param  {Queue}   queue          The queue to return the message to
   * @param  {Message} message        The message
   * @param  {integer} delayMs        The delay, milliseconds
   * @return {boolean}                The result of the operation
   */
  async delayMessageRetry(queue, message, delayMs) {
    throw new TypeError('delayMessageRetry() method must be implemented when extending from RetryDelayer');
  }

  /* eslint-enable */
}

// ------- Exports -------------------------------------------------------------

module.exports = RetryDelayer;

// ------- End -----------------------------------------------------------------
