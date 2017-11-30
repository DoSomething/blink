'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const RabbitMQBroker = require('../../../../../src/lib/brokers/RabbitMQ/RabbitMQBroker');
const RabbitManagement = require('../../../../helpers/RabbitManagement');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(chaiAsPromised);

// ------- Tests ---------------------------------------------------------------

/**
 * Exchange class interface
 */
test('RabbitMQBroker interface', () => {
  const config = require('../../../../../config');
  const broker = new RabbitMQBroker(config.amqp);

  broker.should.respondTo('connect');
  broker.should.respondTo('disconnect');
  broker.should.respondTo('publishToRoute');
  broker.should.respondTo('subscribe');
  broker.should.respondTo('ack');
  broker.should.respondTo('nack');
  broker.should.respondTo('createQueue');
  broker.should.respondTo('purgeQueue');
  broker.should.respondTo('deleteQueue');
});

/**
 * Exchange.setup(): Test RabbitMQ connection
 */
test('Exchange.setup(): Test RabbitMQ connection', async () => {
  const config = require('../../../../../config');

  const broker = new RabbitMQBroker(config.amqp);
  const connected = await broker.connect();
  connected.should.be.true;
});

/**
 * Exchange.setup(): Make sure exchange is created with expected params
 */
test('Exchange.setup(): Make sure exchanges are created with expected params', async () => {
  const config = require('../../../../../config');

  const broker = new RabbitMQBroker(config.amqp);
  await broker.connect();

  // Test queue settings with RabbitMQ Management Plugin API.
  const topicExchangeName = config.amqp.settings.topicExchange;
  const rabbit = new RabbitManagement(config.amqpManagement);
  const topologyTestXInfo = await rabbit.getExchangeInfo(topicExchangeName);

  topologyTestXInfo.should.have.property('name', topicExchangeName);
  topologyTestXInfo.should.have.property('type', 'topic');
  topologyTestXInfo.should.have.property('vhost', config.amqp.connection.vhost);
  topologyTestXInfo.should.have.property('durable', true);
  topologyTestXInfo.should.have.property('auto_delete', false);
  topologyTestXInfo.should.have.property('internal', false);
});

// ------- End -----------------------------------------------------------------
