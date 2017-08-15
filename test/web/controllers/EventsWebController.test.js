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
 * GET /api/v1/events
 */
test('GET /api/v1/events should respond with JSON list available tools', async (t) => {
  const res = await t.context.supertest.get('/api/v1/events')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password);

  res.status.should.be.equal(200);

  // Check response to be json
  res.header.should.have.property('content-type')
    .and.have.string('application/json');

  // Check response.
  res.body.should.have.property('user-create')
    .and.have.string('/api/v1/events/user-create');
  res.body.should.have.property('user-signup')
    .and.have.string('/api/v1/events/user-signup');
  res.body.should.have.property('user-signup-post')
    .and.have.string('/api/v1/events/user-signup-post');
});


/**
 * POST /api/v1/events/user-create
 */
test('POST /api/v1/events/user-create should validate incoming message', async (t) => {
  // Test empty message
  const responseToEmptyPayload = await t.context.supertest
    .post('/api/v1/events/user-create')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send({});
  responseToEmptyPayload.status.should.be.equal(422);
  responseToEmptyPayload.body.should.have.property('ok', false);
  responseToEmptyPayload.body.should.have.property('message')
    .and.have.string('"id" is required');

  // Test incorrect id
  const responseToNotUuid = await t.context.supertest
    .post('/api/v1/events/user-create')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send({
      id: 'not-an-uuid',
    });
  responseToNotUuid.status.should.be.equal(422);
  responseToNotUuid.body.should.have.property('ok', false);
  responseToNotUuid.body.should.have.property('message')
    .and.have.string('fails to match the valid object id pattern');

  // Test correct payload
  // TODO: Move data stubs outside of the test file.
  const responseValidPayload = await t.context.supertest
    .post('/api/v1/events/user-create')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send({
      id: '57d1aa6142a06448258b4572',
      _id: '57d1aa6142a06448258b4572',
      first_name: 'Sergii',
      last_name: null,
      last_initial: '',
      photo: null,
      email: 'sergii+test@dosomething.org',
      mobile: null,
      facebook_id: null,
      interests: [
        'basketball',
        'wwe',
      ],
      birthdate: '1996-05-28',
      addr_street1: null,
      addr_street2: null,
      addr_city: null,
      addr_state: null,
      addr_zip: '10001',
      source: 'phoenix',
      source_detail: null,
      slack_id: null,
      mobilecommons_id: '167181555',
      parse_installation_ids: null,
      mobile_status: 'undeliverable',
      language: 'en',
      country: 'UA',
      drupal_id: '4091040',
      role: 'user',
      last_authenticated_at: '2017-04-25T18:51:28+00:00',
      updated_at: '2017-04-25T18:51:28+00:00',
      created_at: '2016-09-08T18:13:43+00:00',
    });
  responseValidPayload.status.should.be.equal(202);
  responseValidPayload.body.should.have.property('ok', true);
  responseValidPayload.body.should.have.property('message')
    .and.equal('Message queued');
});

/**
 * POST /api/v1/events/user-signup
 */
test('POST /api/v1/events/user-signup should publish message to user-signup-event', async (t) => {
  const data = {
    random: 'key',
    nested: {
      random2: 'key2',
    },
  };

  const res = await t.context.supertest.post('/api/v1/events/user-signup')
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
  const messages = await rabbit.getMessagesFrom('user-signup-event', 1);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

/**
 * POST /api/v1/events/user-signup-post
 */
test('POST /api/v1/events/user-signup-post should publish message to user-signup-post-event', async (t) => {
  const data = {
    random: 'key',
    nested: {
      random2: 'key2',
    },
  };

  const res = await t.context.supertest.post('/api/v1/events/user-signup-post')
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
  const messages = await rabbit.getMessagesFrom('user-signup-post-event', 1);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);
});

// ------- End -----------------------------------------------------------------
