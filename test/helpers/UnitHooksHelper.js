'use strict';

// ------- Imports -------------------------------------------------------------

const AMQPChannel = require('amqplib/lib/channel_model').Channel;
const AMQPConnection = require('amqplib/lib/connection').Connection;
const Chance = require('chance');
const net = require('net');
const sinon = require('sinon');

// ------- Internal imports ----------------------------------------------------

const RabbitMQBroker = require('../../src/lib/brokers/RabbitMQ/RabbitMQBroker');
const Queue = require('../../src/lib/Queue');
const FreeFormMessage = require('../../src/messages/FreeFormMessage');

// Logger is configured imperatively, make sure unit tests get nice logs formatting.
require('../../config');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

// ------- Helpers -------------------------------------------------------------

class UnitHooksHelper {
  static createRandomQueueInMemory(t) {
    const config = require('../../config');

    // Optional: tag connection for easier debug.
    const clientDescription = {
      name: `${config.app.name}-test-client`,
      version: config.app.version,
      env: config.app.env,
    };
    const broker = new RabbitMQBroker(config.amqp, clientDescription);

    const queue = new Queue(broker, `test-autogen-${chance.word()}-${chance.word()}`);
    queue.messageClass = FreeFormMessage;

    t.context.broker = broker;
    t.context.queue = queue;
  }

  static destroyRandomQueueInMemory(t) {
    t.context.queue = false;
    t.context.broker = false;
  }

  static createFakeRabbitMQBroker(t) {
    // Automatically provide sandbox for stubbing the channel.
    const sandbox = sinon.createSandbox();

    // Fake channel.
    const socket = new net.Socket();
    const connection = new AMQPConnection(socket);
    const channel = new AMQPChannel(connection);

    // Fake Broker.
    const amqpConfig = {
      connection: {},
      settings: {
        topicExchange: chance.word(),
      },
    };
    const broker = new RabbitMQBroker(amqpConfig);

    // Stub broker to return the fake channel.
    sandbox.stub(broker, 'getChannel').returns(channel);

    // Expose stubs through test context.
    t.context.sandbox = sandbox;
    t.context.channel = channel;
    t.context.broker = broker;
  }

  static destroyFakeRabbitMQBroker(t) {
    // Cleanup stubs and reset context.
    t.context.sandbox.restore();
    t.context.channel = false;
    t.context.broker = false;
    t.context.sandbox = false;
  }
}

module.exports = UnitHooksHelper;

// ------- End -----------------------------------------------------------------
