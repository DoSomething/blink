'use strict';

// ------- Interface -----------------------------------------------------------

class Timer {
  /* eslint-disable no-unused-vars, class-methods-use-this */
  /* Next methods are interface methods declarations */

  start() {
    throw new TypeError('start() method must be implemented when extending from Timer');
  }

  stop() {
    throw new TypeError('stop() method must be implemented when extending from Timer');
  }

  async tick() {
    throw new TypeError('tick() method must be implemented when extending from Timer');
  }

  async run(tickCount) {
    throw new TypeError('run() method must be implemented when extending from Timer');
  }

  /* eslint-enable */
}

// ------- Exports -------------------------------------------------------------

module.exports = Timer;

// ------- End -----------------------------------------------------------------
