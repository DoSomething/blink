'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');

const RabbitManagement = require('../../../src/lib/RabbitManagement');
const HooksHelper = require('../../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
test.beforeEach(HooksHelper.startBlinkWebApp);
test.afterEach(HooksHelper.stopBlinkWebApp);

// ------- Tests ---------------------------------------------------------------

/**
 * GET /api/v1/tools
 */
test('GET /api/v1/tools should respond with JSON list available tools', async (t) => {
  const res = await t.context.supertest.get('/api/v1/tools')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  res.body.should.have.property('fetch');
  res.body.fetch.should.match(/\/api\/v1\/tools\/fetch$/);
});

/**
 * POST /api/v1/tools/fetch
 */
test('POST /api/v1/tools/fetch should validate incoming parameters', async (t) => {
  const res = await t.context.supertest.post('/api/v1/tools/fetch')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send({
      // Send no url param and incorrect options param.
      options: 42,
    });

  res.status.should.be.equal(422);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  res.body.should.have.property('code', 'error_validation_failed');
  res.body.should.have.property('ok', false);
  res.body.should.have.property('message').and.to.have.string('"url" is required');
});

/**
 * POST /api/v1/tools/fetch
 */
test('GET /api/v1/tools/fetch should publish message to fetch queue', async (t) => {
  const data = {
    url: 'https://httpbin.org/post',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Blink',
        login: 'blink',
      }),
    },
  };

  const res = await t.context.supertest.post('/api/v1/tools/fetch')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  res.status.should.be.equal(202);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  res.body.should.have.property('ok', true);


  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  // TODO: queue cleanup to make sure that it's not OLD message.
  const messages = await rabbit.getMessagesFrom('fetch', 1);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

// ------- End -----------------------------------------------------------------
