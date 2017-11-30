'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Chance = require('chance');
const sinonChai = require('sinon-chai');

// ------- Internal imports ----------------------------------------------------

const RabbitMQBroker = require('../../../../../src/lib/brokers/RabbitMQ/RabbitMQBroker');
const MessageFactoryHelper = require('../../../../helpers/MessageFactoryHelper');
const UnitHooksHelper = require('../../../../helpers/UnitHooksHelper');

// ------- Init ----------------------------------------------------------------

const chance = new Chance();

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

// Prepare fakes for each test and clean up after them.
test.beforeEach(UnitHooksHelper.createFakeRabbitMQBroker);
test.afterEach.always(UnitHooksHelper.destroyFakeRabbitMQBroker);

// ------- Tests ---------------------------------------------------------------

/**
 * Dequeuer: constructor()
 */
test('RabbitMQBroker: Should implement Broker interface', () => {
  const broker = new RabbitMQBroker({});
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
 * RabbitMQBroker: connect()
 */
test('RabbitMQBroker.connect(): Should delegate connection to the connection manager and assert dependencies', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Stub connection manager's connect.
  const connectStub = sandbox
    .stub(broker.connectionManager, 'connect')
    .callsFake(async function () {
      // `this` is an instance of RabbitMQConnectionManager.
      this.channel = channel;
      this.connected = true;
      return true;
    });
  // Restore original getChannel() function, as we're setting channel manualy.
  broker.getChannel.restore();

  // Stub assert exchanegs in broker.
  const assertExchangesStub = sandbox.stub(broker, 'assertExchanges').resolves(true);

  // Execute the connect.
  const result = await broker.connect();
  result.should.be.true;

  // Ensure connection is delegated
  connectStub.should.have.been.calledOnce;

  // Ensure dependencies are asserted.
  assertExchangesStub.should.have.been.calledOnce;

  // Ensure broker exposes connected state and the channel.
  broker.isConnected().should.be.true;
  broker.getChannel().should.be.deep.equal(channel);
});

/**
 * RabbitMQBroker: connect()
 */
test('RabbitMQBroker.connect(): Should fail on unsuccessful connection', async (t) => {
  // Set variables from the context.
  const { sandbox, broker } = t.context;

  // Stub connection manager's connect.
  const connectStub = sandbox.stub(broker.connectionManager, 'connect').resolves(false);
  const assertExchangesStub = sandbox.stub(broker, 'assertExchanges').resolves(true);

  // Execute the connect.
  const result = await broker.connect();
  result.should.be.false;

  // Ensure connection is delegated
  connectStub.should.have.been.calledOnce;

  // Ensure dependencies are asserted.
  assertExchangesStub.should.have.not.been.called;
});

/**
 * RabbitMQBroker: connect()
 */
test('RabbitMQBroker.connect(): Should fail on unsuccessful dependencies assertion', async (t) => {
  // Set variables from the context.
  const { sandbox, broker } = t.context;

  // Stub connection manager's connect.
  const connectStub = sandbox.stub(broker.connectionManager, 'connect').resolves(true);
  const assertExchangesStub = sandbox.stub(broker, 'assertExchanges').resolves(false);

  // Execute the connect.
  const result = await broker.connect();
  result.should.be.false;

  // Ensure connection is delegated
  connectStub.should.have.been.calledOnce;

  // Ensure dependencies are asserted.
  assertExchangesStub.should.have.been.calledOnce;
});

/**
 * RabbitMQBroker: disconnect()
 */
test('RabbitMQBroker.disconnect(): Should delegate disconnect to the connection manager', async (t) => {
  // Set variables from the context.
  const { sandbox, broker } = t.context;

  // Stub connection manager's connect.
  const disconnectStub = sandbox.stub(broker.connectionManager, 'disconnect').resolves(true);

  // Execute the connect.
  await broker.disconnect();

  // Ensure connection is delegated
  disconnectStub.should.have.been.calledOnce;
});

/**
 * RabbitMQBroker: ack()
 */
test('RabbitMQBroker.ack(): Should delegate message ack to amqplib', (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Stub channel.sendImmediately() that sends all synchronous requests
  // to the socket.
  // @see https://github.com/squaremo/amqp.node/blob/master/lib/channel.js#L63
  const sendImmediatelyStub = sandbox.stub(channel, 'sendImmediately').returns(42);

  // Spy on ack. We don't need to replace this completely, as it
  // uses channel.sendImmediately() to perform actual call.
  // @see https://github.com/squaremo/amqp.node/blob/master/lib/channel_model.js#L218
  const ackSpy = sandbox.spy(channel, 'ack');

  // Prepare fake message to acknowledgement.
  const message = MessageFactoryHelper.getFakeRabbitMessage();
  // AMQPLib's ack method implicitly depends on mesaage.fields.deliveryTag.
  // We'll ensure it works correctly by by spying on sendImmediately();
  message.fields.deliveryTag.should.be.not.empty;
  // Acknowledge the fake message.
  broker.ack(message);

  // Ack should be called.
  ackSpy.should.have.been.calledOnce;

  // Channel.ack() should pass message delivery tag to sendImmediately().
  sendImmediatelyStub.should.have.been.calledOnce;
  // Arg[0] = operation code, arg[1] = arguments object.
  const deliveryTagCallArgument = sendImmediatelyStub.firstCall.args[1].deliveryTag;
  message.fields.deliveryTag.should.be.equal(deliveryTagCallArgument);
});

/**
 * RabbitMQBroker: nack()
 */
test('RabbitMQBroker.nack(): Should delegate message nack to amqplib', (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Stub channel.sendImmediately() that sends all synchronous requests
  // the socket.
  // @see https://github.com/squaremo/amqp.node/blob/master/lib/channel.js#L63
  const sendImmediatelyStub = sandbox.stub(channel, 'sendImmediately').returns(42);

  // Spy on reject. We don't need to replace this completely, as it
  // uses channel.sendImmediately() to perform actual call.
  // @see https://github.com/squaremo/amqp.node/blob/master/lib/channel_model.js#L243
  const rejectSpy = sandbox.spy(channel, 'reject');

  // Prepare fake message to acknowledgement.
  const message = MessageFactoryHelper.getFakeRabbitMessage();
  // AMQPLib's reject() method implicitly depends on mesaage.fields.deliveryTag.
  // We'll ensure it works correctly by by spying on sendImmediately();
  message.fields.deliveryTag.should.be.not.empty;
  // Negative acknowledge the fake message.
  broker.nack(message);

  // Reject should be called.
  rejectSpy.should.have.been.calledOnce;

  // Channel.reject() should pass message delivery tag to sendImmediately().
  sendImmediatelyStub.should.have.been.calledOnce;
  // Arg[0] = operation code, arg[1] = arguments object.
  const deliveryTagCallArgument = sendImmediatelyStub.firstCall.args[1].deliveryTag;
  message.fields.deliveryTag.should.be.equal(deliveryTagCallArgument);
});

/**
 * RabbitMQBroker: createQueue()
 */
test('RabbitMQBroker.createQueue(): Happy path', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const numberOfRoutes = 5;
  const queueRoutes = chance.n(chance.word, numberOfRoutes);

  // Stub amqplib's assertQueue().
  // Response example take from the docs.
  // @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
  const assertQueueStub = sandbox.stub(channel, 'assertQueue').resolves({
    queue: queueName,
    messageCount: 0,
    consumerCount: 0,
  });

  // Stub amqplib's bindQueue().
  // The server reply resolves to an empty object.
  // @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_bindExchange
  const bindQueueStub = sandbox.stub(channel, 'bindQueue').resolves({});

  // Execute the function.
  const result = await broker.createQueue(queueName, queueRoutes);
  result.should.be.true;

  // Ensure queue assertion has been called.
  assertQueueStub.should.have.been.calledOnce;

  // Ensure the queue has been bound to the topic exchange on expected routes.
  bindQueueStub.should.have.callCount(numberOfRoutes);
  for (const [queueArg, exchangeArg, routeArg] of bindQueueStub.args) {
    queueArg.should.equal(queueName);
    exchangeArg.should.equal(broker.topicExchange);
    routeArg.should.be.oneOf(queueRoutes);
  }
});

/**
 * RabbitMQBroker: createQueue()
 */
test('RabbitMQBroker.createQueue(): should fail on channel.assertQueue() errors', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const numberOfRoutes = 5;
  const queueRoutes = chance.n(chance.word, numberOfRoutes);

  // Stub amqplib's assertQueue().
  // @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
  const assertQueueStub = sandbox.stub(channel, 'assertQueue').throws(() => {
    // Fake unexpected error thrown from Message.assertQueue().
    const error = new Error('Testing unexpected exception from Channel.assertQueue()');
    return error;
  });
  // Stub amqplib's bindQueue().
  const bindQueueStub = sandbox.stub(channel, 'bindQueue').resolves({});

  // Execute the function.
  const result = await broker.createQueue(queueName, queueRoutes);
  result.should.be.false;

  // Ensure queue assertion has been called.
  assertQueueStub.should.have.been.calledOnce;

  // Ensure function returns before attempting to bind the queue.
  bindQueueStub.should.have.not.been.called;
});

/**
 * RabbitMQBroker: createQueue()
 */
test('RabbitMQBroker.createQueue(): should fail on any channel.bindQueue() error', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const numberOfRoutes = 5;
  const queueRoutes = chance.n(chance.word, numberOfRoutes);

  // Stub amqplib's assertQueue().
  // Response example take from the docs.
  // @see http://www.squaremobius.net/amqp.node/channel_api.html#channel_assertQueue
  const assertQueueStub = sandbox.stub(channel, 'assertQueue').resolves({
    queue: queueName,
    messageCount: 0,
    consumerCount: 0,
  });

  // Stub amqplib's bindQueue().
  // It will return success for all calls except the third one.
  // On the third call it'll simulate unexpected error.
  const bindQueueStub = sandbox.stub(channel, 'bindQueue');
  bindQueueStub.onThirdCall().throws(() => {
    // Fake unexpected error thrown from Message.assertQueue().
    const error = new Error('Testing unexpected exception from Channel.bindQueue()');
    return error;
  });
  bindQueueStub.resolves({});

  // Execute the function.
  const result = await broker.createQueue(queueName, queueRoutes);
  // Failure on the third bindQueue() call should still count as a failure.
  result.should.be.false;

  // Ensure queue assertion has been called.
  assertQueueStub.should.have.been.calledOnce;

  // We just need to know that we, in fact, called bindQueue().
  bindQueueStub.should.have.called;
});

/**
 * RabbitMQBroker: purgeQueue()
 */
test('RabbitMQBroker.purgeQueue(): Happy path', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const messageCount = chance.integer({ min: 1 });

  // Stub amqplib's purgeQueue().
  // Response example take from the docs.
  // http://www.squaremobius.net/amqp.node/channel_api.html#channel_purgeQueue
  const purgeQueueStub = sandbox.stub(channel, 'purgeQueue').resolves({
    messageCount,
  });

  // Execute the function.
  const result = await broker.purgeQueue(queueName);
  result.should.equal(messageCount);

  // Ensure queue purging has been correctly delegated to amqplib.
  purgeQueueStub.should.have.been.calledOnce;
  purgeQueueStub.should.have.been.calledWithExactly(queueName);
});

/**
 * RabbitMQBroker: purgeQueue()
 */
test('RabbitMQBroker.purgeQueue(): should fail on incorrect server response', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();

  // Stub channel.purgeQueue()
  const purgeQueueStub = sandbox.stub(channel, 'purgeQueue').throws(() => {
    // Fake unexpected error thrown from Message.purgeQueue().
    const error = new Error('Testing unexpected exception from Channel.purgeQueue()');
    return error;
  });

  // Execute the connect.
  const purgePromise = broker.purgeQueue(queueName);
  await purgePromise.should.be.rejectedWith(
    Error,
    `Failed to purge queue "${queueName}"`,
  );
  purgeQueueStub.should.have.been.calledOnce;
});

/**
 * RabbitMQBroker: deleteQueue()
 */
test('RabbitMQBroker.deleteQueue(): Happy path', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const messageCount = chance.integer({ min: 1 });

  // Stub amqplib's deleteQueue().
  // Response example take from the docs.
  // http://www.squaremobius.net/amqp.node/channel_api.html#channel_deleteQueue
  const deleteQueueStub = sandbox.stub(channel, 'deleteQueue').resolves({
    messageCount,
  });

  // Execute the function.
  const result = await broker.deleteQueue(queueName);
  result.should.equal(messageCount);

  // Ensure queue deletion has been correctly delegated to amqplib.
  deleteQueueStub.should.have.been.calledOnce;
  deleteQueueStub.should.have.been.calledWithExactly(queueName, {
    ifUnused: false,
    ifEmpty: false,
  });
});

/**
 * RabbitMQBroker: deleteQueue()
 */
test('RabbitMQBroker.deleteQueue(): should fail on incorrect server response', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();

  // Stub channel.deleteQueue()
  const deleteQueueStub = sandbox.stub(channel, 'deleteQueue').throws(() => {
    // Fake unexpected error thrown from Message.deleteQueue().
    const error = new Error('Testing unexpected exception from Channel.deleteQueue()');
    return error;
  });

  // Execute the connect.
  const deletePromise = broker.deleteQueue(queueName);
  await deletePromise.should.be.rejectedWith(
    Error,
    `Failed to delete queue "${queueName}"`,
  );
  deleteQueueStub.should.have.been.calledOnce;
});

/**
 * RabbitMQBroker: publishToRoute()
 */
test('RabbitMQBroker.publishToRoute(): Happy path', (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const routeName = chance.word();
  const message = MessageFactoryHelper.getRandomMessage(true);

  // Stub amqplib's publish().
  // Response example take from the docs.
  // http://www.squaremobius.net/amqp.node/channel_api.html#channel_publish
  const publishStub = sandbox.stub(channel, 'publish').returns(true);

  // Execute the function.
  broker.publishToRoute(routeName, message);

  // Check that the message publishing has been correctly delegated to amqplib.
  publishStub.should.have.been.calledOnce;
  const [exchangeArg, routeArg, bufferArg, optionsArg] = publishStub.firstCall.args;
  exchangeArg.should.be.equal(broker.topicExchange);
  routeArg.should.be.equal(routeName);
  bufferArg.toString().should.be.equal(message.toString());
  optionsArg.should.be.have.property('mandatory', true);
  optionsArg.should.be.have.property('persistent', true);
});

/**
 * RabbitMQBroker: subscribe()
 */
test('RabbitMQBroker.subscribe(): Happy path', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const consumerTag = chance.word();
  const callback = () => true;

  // Stub amqplib's consume().
  // Response example take from the docs.
  // http://www.squaremobius.net/amqp.node/channel_api.html#channel_consume
  const consumeStub = sandbox.stub(channel, 'consume').resolves({
    consumerTag,
  });

  // Execute the function.
  const result = await broker.subscribe(queueName, callback, consumerTag);
  result.should.be.equal(consumerTag);


  // Check that the callback subscription has been correctly delegated to amqplib.
  consumeStub.should.have.been.calledOnce;
  const [queueArg, callbackArg, optionsArg] = consumeStub.firstCall.args;
  queueArg.should.be.equal(queueName);
  callbackArg.should.be.equal(callback);
  callbackArg.should.be.equal(callback);
  optionsArg.should.be.have.property('noAck', false);
  optionsArg.should.be.have.property('exclusive', false);
  optionsArg.should.be.have.property('consumerTag', consumerTag);
});

/**
 * RabbitMQBroker: subscribe()
 */
test('RabbitMQBroker.subscribe(): Callback is executed on new message', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Define test parameters.
  const queueName = chance.word();
  const consumerTag = chance.word();
  const dequeuerSpy = sandbox.spy(rabbitMessage => rabbitMessage);

  // Stub amqplib's consume().
  // @see https://github.com/squaremo/amqp.node/blob/master/lib/callback_model.js#L186
  // Make it register consumer without actually performing RPC to rabbit.
  const consumeStub = sandbox.stub(channel, 'consume').callsFake(async function () {
    // `this` is amqplib's Channel.
    this.registerConsumer(consumerTag, dequeuerSpy);
    return consumerTag;
  });

  // Execute the function.
  await broker.subscribe(queueName, dequeuerSpy);
  consumeStub.should.have.been.calledOnce;

  // Imitate broker sending a message to the consumer.
  const message = MessageFactoryHelper.getFakeRabbitMessage(false, consumerTag);
  channel.emit('delivery', message);

  // Ensure the callback recieved the message. So cool.
  dequeuerSpy.should.have.been.calledOnce;
  const [messageArg] = dequeuerSpy.firstCall.args;
  messageArg.should.be.deep.equal(message);
});

/**
 * RabbitMQBroker: assertExchanges()
 */
test('RabbitMQBroker.assertExchanges(): Should assert all dependencies', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Stub channel.assertExchange()
  // @see https://github.com/squaremo/amqp.node/blob/master/lib/channel.js#L63
  const assertExchangeStub = sandbox.stub(channel, 'assertExchange')
    .onFirstCall().resolves({ exchange: broker.topicExchange });

  // Execute the connect.
  const result = await broker.assertExchanges();
  result.should.be.true;

  // Ensure all exchanges have been created.
  assertExchangeStub.should.have.callCount(1);

  // Ensure dependencies are asserted.
  assertExchangeStub.getCall(0).args.should.deep.equal([
    broker.topicExchange,
    'topic',
  ]);
});

/**
 * RabbitMQBroker: assertExchanges()
 */
test('RabbitMQBroker.assertExchanges(): should fail on incorrect server response', async (t) => {
  // Set variables from the context.
  const { sandbox, channel, broker } = t.context;

  // Stub channel.assertExchange()
  const assertExchangeStub = sandbox.stub(channel, 'assertExchange').throws(() => {
    // Fake unexpected error thrown from Message.assertExchange().
    const error = new Error('Testing unexpected exception from Channel.fromRabbitMessage()');
    return error;
  });

  // Execute the connect.
  const result = await broker.assertExchanges();
  result.should.be.false;
  assertExchangeStub.should.have.been.calledOnce;
});

// ------- End -----------------------------------------------------------------
