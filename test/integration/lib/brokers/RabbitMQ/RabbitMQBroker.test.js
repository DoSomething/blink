'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const RabbitMQBroker = require('../../../../../src/lib/brokers/RabbitMQ/RabbitMQBroker');
const Queue = require('../../../../../src/lib/Queue');
const Message = require('../../../../../src/messages/Message');
const RabbitManagement = require('../../../../helpers/RabbitManagement');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(chaiAsPromised);

// ------- Tests ---------------------------------------------------------------

/**
 * Exchange.setup(): Test RabbitMQ connection
 */
test('RabbitMQBroker.connect(): Test RabbitMQ connection', async () => {
  const config = require('../../../../../config');

  const broker = new RabbitMQBroker(config.amqp);
  const connected = await broker.connect();
  connected.should.be.true;
});

/**
 * Exchange.setup(): Make sure exchange is created with expected params
 */
test('RabbitMQBroker.connect(): Make sure exchanges are created with expected params', async () => {
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

/**
 * Exchange.publishToRoute(): Ensure priorities work
 */
test('Exchange.publishToRoute(): Make sure exchanges are created with expected params', async () => {
  const config = require('../../../../../config');

  const broker = new RabbitMQBroker(config.amqp);
  await broker.connect();

  class PriorityTestQ extends Queue {}

  const priorityTestQ = new PriorityTestQ(broker);
  await priorityTestQ.create();

  // Purge queue in case it already existed.
  await priorityTestQ.purge();

  const messageStandard1 = new Message({ data: 'standard-1' });
  const messageStandard2 = new Message({ data: 'standard-2' });
  const messageLow = new Message({ data: 'low' });
  const messageHigh = new Message({ data: 'high' });

  // Publish 1 and 2 as standard messages.
  broker.publishToRoute(priorityTestQ.name, messageStandard1);
  broker.publishToRoute(priorityTestQ.name, messageStandard2);

  // Publish 3 to the end
  broker.publishToRoute(priorityTestQ.name, messageLow, 'LOW');

  // Publish 4 to the front
  broker.publishToRoute(priorityTestQ.name, messageHigh, 'HIGH');

  // Wait for all messages to sync into rabbit.
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test messages in the queue using RabbitMQ Management Plugin API.
  const rabbit = new RabbitManagement(config.amqpManagement);
  // Ask for 100 messages, but expect only 4 in response.
  const messages = await rabbit.getMessagesFrom(priorityTestQ.name, 100, false);

  // Ensure the order of messages:
  messages.should.have.lengthOf(4);
  // HIGH:
  messages[0].should.have.property('properties');
  messages[0].properties.should.have.property('priority', 2);
  messages[0].should.have.property('payload');
  messages[0].payload.should.have.string('"data":"high"');
  messages.should.have.lengthOf(4);
  // STANDARD 1:
  messages[1].should.have.property('properties');
  messages[1].properties.should.have.property('priority', 1);
  messages[1].should.have.property('payload');
  messages[1].payload.should.have.string('"data":"standard-1"');
  messages.should.have.lengthOf(4);
  // STANDARD 2:
  messages[2].should.have.property('properties');
  messages[2].properties.should.have.property('priority', 1);
  messages[2].should.have.property('payload');
  messages[2].payload.should.have.string('"data":"standard-2"');
  messages.should.have.lengthOf(4);
  // LOW:
  messages[3].should.have.property('properties');
  messages[3].properties.should.have.property('priority', 0);
  messages[3].should.have.property('payload');
  messages[3].payload.should.have.string('"data":"low"');

  // Cleanup
  await priorityTestQ.delete();
});

// ------- End -----------------------------------------------------------------
