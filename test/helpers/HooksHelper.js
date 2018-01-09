'use strict';

// ------- Imports -------------------------------------------------------------

const Chance = require('chance');
const supertest = require('supertest');

const BlinkApp = require('../../src/app/BlinkApp');
const BlinkWebApp = require('../../src/app/BlinkWebApp');
const RedisConnectionManager = require('../../src/lib/RedisConnectionManager');
const UnitHooksHelper = require('./UnitHooksHelper');


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

  static async startRedis(t) {
    t.context.config = require('../../config');
    // Override retry collection name.
    const settings = Object.assign({}, t.context.config.redis.settings);
    settings.retrySet = `test-set-${chance.word()}`;
    t.context.redis = new RedisConnectionManager({
      connection: t.context.config.redis.connection,
      settings,
    });
    await t.context.redis.connect();
  }

  static async stopRedis(t) {
    // Delete test collection.
    await t.context.redis.getClient().del(t.context.redis.settings.retrySet);
    await t.context.redis.disconnect();
    t.context.config = false;
    t.context.redis = false;
  }

  static async createRandomQueue(t) {
    await UnitHooksHelper.createRandomQueueInMemory(t);
    await t.context.broker.connect();
    await t.context.queue.create();
  }

  static async destroyRandomQueue(t) {
    await t.context.queue.delete();
    await t.context.broker.disconnect();
    UnitHooksHelper.destroyRandomQueueInMemory(t);
  }
}

module.exports = HooksHelper;

// ------- End -----------------------------------------------------------------
