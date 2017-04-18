'use strict';

const logger = require('winston');

class Worker {

  constructor(blink) {
    this.blink = blink;

    // Bind process method to queue context
    this.consume = this.consume.bind(this);
  }

  perform() {
    if (this.queue) {
      logger.debug(`Listening for messages in "${this.queue.name}" queue`);
      // TODO: generate consumer tag
      this.queue.subscribe(this.consume);
    } else {
      logger.warning('Queue is not established, waiting');
    }
  }

}

module.exports = Worker;
