'use strict';

/**
 * Imports.
 */
const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const RabbitManagement = require('../../src/lib/RabbitManagement');

// Chai setup.
chai.should();
chai.use(chaiAsPromised);

/**
 * Test RabbitManagement interface
 */
test('RabbitManagement: Test class interface', () => {
  const locals = require('../../config');
  const rabbit = new RabbitManagement(locals.amqpManagement);

  rabbit.should.respondTo('getQueueInfo');
  rabbit.should.respondTo('getQueueBindings');
});

/**
 * RabbitManagement.getQueueInfo(): Test Queue not found response
 */
test('RabbitManagement.getQueueInfo(): Test Queue not found response', async () => {
  // Local config
  const config = require('../../config');
  const rabbit = new RabbitManagement(config.amqpManagement);

  // Test request to fail.
  const failedGetQueueInfo = rabbit.getQueueInfo('not-initialized');
  await failedGetQueueInfo.should.be.rejectedWith(
    Error,
    'Incorrect RabbitManagement.getQueueInfo() response for GET /queues/blink/not-initialized',
  );
});


/**
 * RabbitManagement.getQueueBindings(): Test response for not bound queues
 */
test('RabbitManagement.getQueueBindings(): Test response for not bound queues', async () => {
  // Local config
  const config = require('../../config');
  const rabbit = new RabbitManagement(config.amqpManagement);

  // Test request to return 0 bindings.
  const bindings = await rabbit.getQueueBindings('not-bound-queue', config.amqp.exchange);
  bindings.should.be.false;
});
