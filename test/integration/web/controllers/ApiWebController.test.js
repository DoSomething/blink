'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const HooksHelper = require('../../../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
test.beforeEach(HooksHelper.startBlinkWebApp);
test.afterEach(HooksHelper.stopBlinkWebApp);

// ------- Tests ---------------------------------------------------------------

/**
 * GET /
 */
test('GET / should be polite', async (t) => {
  const res = await t.context.supertest.get('/')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);
  res.text.should.be.equal('Hi, I\'m Blink!');
});

/**
 * GET /api
 */
test('GET /api should respond with JSON list of API versions', async (t) => {
  const res = await t.context.supertest.get('/api')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response to include /api/v1
  res.body.should.have.property('v1');
  res.body.v1.should.match(/\/api\/v1$/);
});

/**
 * GET /api/v1
 */
test('GET /api/v1 should list available endpoints', async (t) => {
  const res = await t.context.supertest.get('/api/v1')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response to inclue expected endpoints
  res.body.should.have.property('tools');
  res.body.tools.should.match(/\/api\/v1\/tools$/);
  res.body.should.have.property('webhooks');
  res.body.webhooks.should.match(/\/api\/v1\/webhooks$/);
});

// ------- End -----------------------------------------------------------------
