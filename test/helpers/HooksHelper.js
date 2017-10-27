'use strict';

// ------- Imports -------------------------------------------------------------

const Chance = require('chance');
const supertest = require('supertest');

const BlinkApp = require('../../src/app/BlinkApp');
const BlinkWebApp = require('../../src/app/BlinkWebApp');
const Exchange = require('../../src/lib/Exchange');
const Queue = require('../../src/lib/Queue');
const FreeFormMessage = require('../../src/messages/FreeFormMessage');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

// ------- Helpers -------------------------------------------------------------

class HooksHelper {
  static async startBlinkWebApp(t) {
    t.context.config = require('../../config');
    t.context.blink = new BlinkWebApp(t.context.config);
    await t.context.blink.start();
    t.context.supertest = supertest(t.context.blink.web.app.callback());
  }

  static async stopBlinkWebApp(t) {
    await t.context.blink.stop();
    t.context.supertest = false;
    t.context.config = false;
  }

  static async startBlinkApp(t) {
    t.context.config = require('../../config');
    t.context.blink = new BlinkApp(t.context.config);
    await t.context.blink.start();
  }

  static async stopBlinkApp(t) {
    await t.context.blink.stop();
    t.context.config = false;
  }

  static async createRandomQueue(t) {
    await HooksHelper.createRandomQueueInMemory(t);
    await t.context.queue.setup();
  }

  static async destroyRandomQueue(t) {
    await t.context.queue.delete();
    t.context.exchange.channel.close();
    t.context.exchange.connection.close();
    HooksHelper.destroyRandomQueueInMemory(t);
  }

  static async createRandomQueueInMemory(t) {
    const config = require('../../config');
    const exchange = new Exchange(config);
    // Todo: make independent.
    await exchange.setup();

    const queue = new Queue(exchange, `test-autogen-${chance.word()}-${chance.word()}`);
    queue.messageClass = FreeFormMessage;

    t.context.exchange = exchange;
    t.context.queue = queue;
  }

  static destroyRandomQueueInMemory(t) {
    t.context.queue = false;
    t.context.exchange = false;
  }
}

module.exports = HooksHelper;

// ------- End -----------------------------------------------------------------
