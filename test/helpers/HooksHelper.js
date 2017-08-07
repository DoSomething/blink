'use strict';

// libraries
const supertest = require('supertest');

// App modules
const BlinkWebApp = require('../../src/app/BlinkWebApp');

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
}

module.exports = HooksHelper;
