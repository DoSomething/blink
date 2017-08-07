'use strict';

/**
 * Imports.
 */
const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Exchange = require('../../src/lib/Exchange');
const Queue = require('../../src/queues/Queue');


// Chai setup.
chai.should();
chai.use(chaiAsPromised);

/**
 * Exchange class interface
 */
test.skip('Exchange interface', () => {
  const locals = require('../../config');
  const testX = new Exchange(locals.amqp);
  testX.should.have.respondTo('setup');
  testX.should.have.respondTo('assertQueue');
});

/**
 * Exchange.setup(): Test RabbitMQ connection
 */
test.skip('Exchange.setup(): Test RabbitMQ connection', async () => {
  const locals = require('../../config');
  const testX = new Exchange(locals.amqp);
  const connected = await testX.setup();
  connected.should.be.true;
});

/**
 * Exchange.setup(): Test exchange with empty name to fail
 */
test.skip('Exchange.setup(): Test exchange with empty name to fail', async () => {
  const locals = require('../../config');

  // Copy RabbitMQ settings, but override exchange with empty string.
  const invalidExchangeSettings = Object.assign({}, locals.amqp, { exchange: '' });

  // Initialize Exchange with incorrect settings.
  const testX = new Exchange(invalidExchangeSettings);
  const incorrectSetupResult = testX.setup();

  // No exchange name should result in rejection from Exchange.setup() .
  await incorrectSetupResult.should.be.rejectedWith(
    Error,
    'Exchange.setup(): Exchange assertion failed for ""',
  );
});


/**
 * Exchange.assertQueue(): Test queue with empty name to fail
 */
test.skip('Exchange.assertQueue(): Test queue with empty name to fail', async () => {
  class WrongNameQ extends Queue {}

  const locals = require('../../config');
  const testX = new Exchange(locals.amqp);
  await testX.setup();

  // Fake queue not initialized in Rabbit.
  const wrongNameQ = new WrongNameQ(testX);
  // Override Queue name and watch setup fail.
  // Empty string would result in automatically generated queue name,
  // thus Queue.setup() method will fail.
  wrongNameQ.name = '';

  const incorrectSetupResult = wrongNameQ.setup();
  await incorrectSetupResult.should.be.rejectedWith(
    Error,
    'Exchange.setup(): Queue assertion failed for ""',
  );
});
