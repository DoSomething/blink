'use strict';

const test = require('ava');
const chai = require('chai');
const sinon = require('sinon');
const rewire = require('rewire');
const sinonChai = require('sinon-chai');

const leanifyTransformer = rewire('../../../../../../src/lib/helpers/logger/transformers/leanify');
const leanifyConfig = require('../../../../../../config/lib/helpers/logger/transformers/leanify');
const MessageFactoryHelper = require('../../../../../helpers/MessageFactoryHelper');

chai.should();
chai.use(sinonChai);
const sandbox = sinon.sandbox.create();

test.afterEach(() => {
  // reset stubs, spies, and mocks
  sandbox.restore();
});

test('leanifyTransformer should remove bloatKeys', () => {
  const message = MessageFactoryHelper.getTwilioInboundMessage();
  const payload = Object.assign({}, message.payload);
  const transformedPayload = leanifyTransformer(payload);
  transformedPayload.data.should.not.have.any.keys(leanifyConfig.bloatKeys);
});

test('leanifyTransformer should not remove keys if not enabled', () => {
  const mockConfig = Object.assign({}, leanifyConfig, { enabled: false });
  const revert = leanifyTransformer.__set__('leanifyConfig', mockConfig);
  const message = MessageFactoryHelper.getTwilioInboundMessage();
  const payload = Object.assign({}, message.payload);
  const transformedPayload = leanifyTransformer(payload);
  revert();

  transformedPayload.data.should.be.eql(message.getData());
});
