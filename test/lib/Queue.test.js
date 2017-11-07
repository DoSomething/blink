'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Queue = require('../../src/lib/Queue');
const RabbitManagement = require('../../src/lib/RabbitManagement');
const Message = require('../../src/messages/Message');
const HooksHelper = require('../helpers/HooksHelper');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(chaiAsPromised);

// Setup blink app for each test.
test.beforeEach(HooksHelper.startBlinkApp);
test.afterEach.always(HooksHelper.stopBlinkApp);

// ------- Tests ---------------------------------------------------------------

/**
 * Queue: Test class interface
 */
test('Queue: Test class interface', (t) => {
  const queue = new Queue(t.context.blink.exchange);
  queue.should.respondTo('setup');
  queue.should.respondTo('publish');
  queue.should.respondTo('nack');
  queue.should.respondTo('ack');
  queue.should.respondTo('purge');
  queue.should.respondTo('subscribe');

  queue.should.have.property('routes');
  queue.routes.should.be.an('array').and.have.length.at.least(1);
});

/**
 * Test that concrete Queue implementation would result in expected queues
 * in RabbitMQ.
 */
test('Queue.setup(): Test RabbitMQ topology assertion', async (t) => {
  class TestBindingQ extends Queue {
    constructor(exchange) {
      super(exchange);
      this.routes.push('*.taco');
    }
  }

  const testBindingQ = new TestBindingQ(t.context.blink.exchange);
  testBindingQ.should.have.property('name');
  testBindingQ.name.should.be.equal('test-binding');
  // Direct + *.taco
  testBindingQ.routes.length.should.equal(2);

  testBindingQ.should.be.an.instanceof(Queue);
  const result = await testBindingQ.setup();
  result.should.be.true;

  // Test queue settings with RabbitMQ Management Plugin API.
  const rabbit = new RabbitManagement(t.context.blink.config.amqpManagement);
  const testBindingQInfo = await rabbit.getQueueInfo(testBindingQ.name);
  testBindingQInfo.should.have.property('name', 'test-binding');
  testBindingQInfo.should.have.property('durable', true);
  testBindingQInfo.should.have.property('auto_delete', false);
  testBindingQInfo.should.have.property('exclusive', false);

  // Test that the queue is binded to the exchange.
  const testBindingQBindings = await rabbit.getQueueBindings(
    testBindingQ.name,
    testBindingQ.exchange.name,
  );
  testBindingQBindings.should.be.an('array').and.have.length(2);
  // Specific route
  testBindingQBindings[0].should.have.property('routing_key', '*.taco');
  testBindingQBindings[0].should.have.property('source', 'test-x');
  testBindingQBindings[0].should.have.property('destination', 'test-binding');
  // Direct route
  testBindingQBindings[1].should.have.property('routing_key', 'test-binding');
  testBindingQBindings[1].should.have.property('source', 'test-x');
  testBindingQBindings[1].should.have.property('destination', 'test-binding');

  // Cleanup.
  await testBindingQ.delete();
});

/**
 * Queue.publish(), Queue.purge(): Test direct publishing and purging
 */
test('Queue.publish(), Queue.purge(): Test direct publishing and purging', async (t) => {
  class TestPurgeQ extends Queue {}

  const testPurgeQueue = new TestPurgeQ(t.context.blink.exchange);
  await testPurgeQueue.setup();

  // Purge queue in case it already existed.
  await testPurgeQueue.purge();

  // Publish test message to the queue.
  const testMessage = new Message({ passed: true });
  const publishResult = testPurgeQueue.publish(testMessage);
  publishResult.should.be.true;

  // Check message count with Queue deletion.
  const purgeResult = await testPurgeQueue.purge();
  purgeResult.should.equal(1);

  // Cleanup
  await testPurgeQueue.delete();
});

/**
 * Queue.publish(), Queue.delete(): Test direct publishing and purging
 */
test('Queue.publish(), Queue.delete(): Test publishing and deleting', async (t) => {
  class TestDeleteQ extends Queue {}

  const testDeleteQ = new TestDeleteQ(t.context.blink.exchange);
  await testDeleteQ.setup();

  // Purge queue in case it already existed.
  await testDeleteQ.purge();

  // Publish message.
  const testMessage = new Message({ passed: true });
  const publishResult = testDeleteQ.publish(testMessage);
  publishResult.should.be.true;

  // Purge queue in case it already exists.
  const deleteResult = await testDeleteQ.delete();
  deleteResult.should.equal(1);
});

/**
 * Queue.purge(): Ensure incorrect queue purging fails
 */
test('Queue.purge(): Ensure incorrect queue purging fails', async (t) => {
  class TestIncorrectPurgeQ extends Queue {}

  const testIncorrectPurgeQ = new TestIncorrectPurgeQ(t.context.blink.exchange);
  // Don't setup queue to make sure Queue.purge() fails.

  // Purge queue in case it already exists.
  const purgeResult = testIncorrectPurgeQ.purge();
  await purgeResult.should.be.rejectedWith(
    Error,
    'Queue.purge(): failed to purge queue "test-incorrect-purge"',
  );

  // Ensure the channel reconnects after error.
  t.context.blink.connected.should.be.false;
  await new Promise(resolve => setTimeout(resolve, 1000));
  t.context.blink.connected.should.be.true;
});

// ------- End -----------------------------------------------------------------
