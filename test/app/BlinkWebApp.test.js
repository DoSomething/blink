'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();

test.beforeEach(HooksHelper.startBlinkWebApp);
test.afterEach(HooksHelper.stopBlinkWebApp);

// ------- Tests ---------------------------------------------------------------

/**
 * GET /
 */
test('GET / should turn down anonymous requests', async (t) => {
  const res = await t.context.supertest.get('/');
  res.status.should.be.equal(401);
  res.text.should.be.have.string('Don\'t blink');
});

// ------- End -----------------------------------------------------------------
