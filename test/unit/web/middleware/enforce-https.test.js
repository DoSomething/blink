'use strict';

require('dotenv').config();

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const enforce = require('koa-sslify');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(sinonChai);

// module to be tested
const enforceHttpsMiddleware = rewire('../../../../src/web/middleware/enforce-https');

const sandbox = sinon.sandbox.create();

test.afterEach((t) => {
  // reset stubs, spies, and mocks
  sandbox.restore();
  t.context = {};
  enforceHttpsMiddleware.__set__('enforceHttps', enforce);
});

test.serial('enforceHttpsMiddleware should return dummy function that always calls next if forceHttps is false', () => {
  const forceHttps = false;
  const middleware = enforceHttpsMiddleware(forceHttps);
  const next = sinon.stub();
  const context = {};

  middleware(context, next);
  next.should.have.been.called;
});

test.serial('enforceHttpsMiddleware should return a function that enforces HTTPS if forceHttps is true', () => {
  const forceHttps = true;
  const enforceStub = sinon.stub();
  enforceHttpsMiddleware.__set__('enforceHttps', enforceStub);
  enforceHttpsMiddleware(forceHttps);

  enforceStub.should.have.been.calledWith({ trustProtoHeader: true });
});
