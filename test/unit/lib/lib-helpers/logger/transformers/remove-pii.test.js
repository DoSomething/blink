'use strict';

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const sinonChai = require('sinon-chai');

const removePIITransformer = rewire('../../../../../../src/lib/helpers/logger/transformers/remove-pii');
const removePIIConfig = require('../../../../../../config/lib/helpers/logger/transformers/remove-pii');
const MessageFactoryHelper = require('../../../../../helpers/MessageFactoryHelper');

chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

test.afterEach(() => {
  // reset stubs, spies, and mocks
  sandbox.restore();
});

test('removePIITransformer should remove PII keys', () => {
  const message = MessageFactoryHelper.getUserMessage();
  const payload = Object.assign({}, message.payload);
  const transformedPayload = removePIITransformer(payload);
  transformedPayload.data.should.not.have.any.keys(removePIIConfig.northstarPIIKeys);
});

test('removePIITransformer should not remove keys if not enabled', () => {
  const mockConfig = Object.assign({}, removePIIConfig, { enabled: false });
  const revert = removePIITransformer.__set__('removePIIConfig', mockConfig);
  const message = MessageFactoryHelper.getUserMessage();
  const payload = Object.assign({}, message.payload);
  const transformedPayload = removePIITransformer(payload);
  revert();

  transformedPayload.data.should.be.eql(message.getData());
});
