'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const Chance = require('chance');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

const CustomerioGambitBroadcastMessage = require('../../../src/messages/CustomerioGambitBroadcastMessage');
const CustomerIoGambitBroadcastWorker = require('../../../src/workers/CustomerIoGambitBroadcastWorker');
const HooksHelper = require('../../helpers/HooksHelper');
const MessageFactoryHelper = require('../../helpers/MessageFactoryHelper');
const RabbitManagement = require('../../helpers/RabbitManagement');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(sinonChai);

const chance = new Chance();

// ------- Tests ---------------------------------------------------------------

test.serial('Gambit Broadcast relay should be consume close to 50 messages per second', async (t) => {
  // Turn off extra logs for this tests, as it genertes thouthands of messages.
  await HooksHelper.startBlinkWebApp(t);
  const blink = t.context.blink;
  const { customerioGambitBroadcastQ } = blink.queues;

  // Publish 2x rate limit messages to the queue
  for (let i = 0; i < 120; i++) {
    const data = MessageFactoryHelper.getValidGambitBroadcastData();
    const meta = {
      request_id: chance.guid({ version: 4 }),
      broadcastId: chance.word(),
    };
    const message = new CustomerioGambitBroadcastMessage({ data, meta });
    customerioGambitBroadcastQ.publish(message);
  }

  // Wait for all messages to sync into rabbit.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Spy on worker's consume();
  const worker = new CustomerIoGambitBroadcastWorker(blink);
  const consumeStub = sinon.stub(worker, 'consume').resolves(true);

  // Kick off message consuming;
  worker.setup();
  worker.start();

  // Ensure that after one second worker consumed close to 60 messages.
  // = expected rate, 60 messages per second!
  // Wait for all messages to sync into rabbit.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Check that call count is below the rate limit.
  consumeStub.callCount.should.be.at.most(50);

  // Await consuming to complete
  // @todo: gracefull worker shutdown instead.
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Cleanup
  consumeStub.restore();
  await HooksHelper.stopBlinkWebApp(t);
});

/**
 * POST /api/v1/webhooks/customerio-gambit-broadcast
 */
test.serial('POST /api/v1/webhooks/customerio-gambit-broadcast should publish message to customerio-gambit-broadcast queue', async (t) => {
  await HooksHelper.startBlinkWebApp(t);

  const broadcastId = chance.word();
  const data = MessageFactoryHelper.getValidGambitBroadcastData(broadcastId);

  const res = await t.context.supertest.post('/api/v1/webhooks/customerio-gambit-broadcast')
    .set('Content-Type', 'application/json')
    .auth(t.context.config.app.auth.name, t.context.config.app.auth.password)
    .send(data);

  // Ensure Customer.io compatible response.
  res.status.should.be.equal(201);

  // Check response to be json
  res.header.should.have.property('content-type');
  res.header['content-type'].should.match(/json/);

  // Check response.
  res.body.should.have.property('ok', true);

  // Check that the message is queued.
  const rabbit = new RabbitManagement(t.context.config.amqpManagement);
  const messages = await rabbit.getMessagesFrom('customerio-gambit-broadcast', 1, false);
  messages.should.be.an('array').and.to.have.lengthOf(1);

  messages[0].should.have.property('payload');
  const payload = messages[0].payload;
  const messageData = JSON.parse(payload);
  messageData.should.have.property('data');
  messageData.data.should.be.eql(data);

  await HooksHelper.stopBlinkWebApp(t);
});


// ------- End -----------------------------------------------------------------
