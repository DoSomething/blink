'use strict';

/**
 * Imports.
 */
const test = require('ava');
const chai = require('chai');
const Router = require('koa-router');

const WebController = require('../../../src/web/controllers/WebController');


// Chai setup.
chai.should();

/**
 * WebController class interface
 */
test('WebController interface', () => {
  const config = require('../../../config');
  const web = new WebController(config);
  web.should.have.respondTo('fullUrl');
});

/**
 * WebController.fullUrl(): Test generating urls for controller methods
 */
test('WebController.fullUrl(): Test generating urls for controller methods', () => {
  class TestController extends WebController {
    constructor(...args) {
      super(...args);
      this.index = this.index.bind(this);
    }

    index() {
      this.logger.info('should not be called');
    }
  }

  const config = require('../../../config');
  const router = new Router();
  config.router = router;

  // Expected port
  config.web.port = 81;

  const testController = new TestController(config);
  router.get('test.route', '/test', testController.index);
  testController.fullUrl('test.route').should.be.equal('http://localhost:81/test');
});

/**
 * WebController.fullUrl(): Test ommitting port 80
 */
test('WebController.fullUrl(): Test ommitting port 80', () => {
  class TestController extends WebController {
    constructor(...args) {
      super(...args);
      this.index = this.index.bind(this);
    }

    index() {
      this.logger.info('should not be called');
    }
  }

  const config = require('../../../config');
  const router = new Router();
  config.router = router;

  // Expected port
  config.web.port = '80';

  const testController = new TestController(config);
  router.get('test.route', '/test', testController.index);
  testController.fullUrl('test.route').should.be.equal('http://localhost/test');
});
