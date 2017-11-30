'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Router = require('koa-router');

const BlinkError = require('../../../../src/errors/BlinkError');
const WebController = require('../../../../src/web/controllers/WebController');
const HooksHelper = require('../../../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
const expect = chai.expect;

test.beforeEach(HooksHelper.startBlinkWebApp);
test.afterEach(HooksHelper.stopBlinkWebApp);

// ------- Tests ---------------------------------------------------------------

/**
 * WebController class interface
 */
test('WebController interface', (t) => {
  const web = new WebController(t.context.blink);
  web.should.have.respondTo('fullUrl');
  web.should.have.respondTo('sendOK');
  web.should.have.respondTo('sendOKNoContent');
  web.should.have.respondTo('sendError');
  web.should.have.respondTo('log');
});

/**
 * WebController.fullUrl(): Test generating urls for controller methods
 */
test('WebController.fullUrl(): Test generating urls for controller methods', (t) => {
  class TestController extends WebController {
    constructor(...args) {
      super(...args);
      this.index = this.index.bind(this);
    }

    index() {
      this.logger.error('should not be called');
    }
  }

  const router = new Router();
  t.context.blink.web.router = router;

  // Override port for tests

  const testController = new TestController(t.context.blink);
  testController.web.port = '81';

  router.get('test.route', '/test', testController.index);
  testController.fullUrl('test.route').should.be.equal('http://localhost:81/test');
});

/**
 * WebController.fullUrl(): Test ommitting port 80
 */
test('WebController.fullUrl(): Test ommitting port 80', (t) => {
  class TestController extends WebController {
    constructor(...args) {
      super(...args);
      this.index = this.index.bind(this);
    }

    index() {
      this.logger.error('should not be called');
    }
  }

  const router = new Router();
  t.context.blink.web.router = router;

  const testController = new TestController(t.context.blink);
  testController.web.port = '80';

  router.get('test.route', '/test', testController.index);
  testController.fullUrl('test.route').should.be.equal('http://localhost/test');
});

/**
 * WebController.fullUrl(): should throw error for unknown path
 */
test('WebController.fullUrl(): should throw error for unknown path', (t) => {
  const web = new WebController(t.context.blink);
  expect(() => web.fullUrl('unknown.path')).to.throw(
    BlinkError,
    'Error: No route found for name: unknown.path',
  );
});

// ------- End -----------------------------------------------------------------
