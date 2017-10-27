'use strict';

// ------- Imports -------------------------------------------------------------

const test = require('ava');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

const Exchange = require('../../src/lib/Exchange');
const RabbitManagement = require('../../src/lib/RabbitManagement');

// ------- Init ----------------------------------------------------------------

chai.should();
chai.use(chaiAsPromised);

// ------- Tests ---------------------------------------------------------------

/**
 * Exchange class interface
 */
test('Exchange interface', () => {
  const config = require('../../config');
  const exchange = new Exchange(config);

  exchange.should.respondTo('setup');
  exchange.should.respondTo('setupQueue');
  exchange.should.respondTo('publish');
  exchange.should.respondTo('limitConsumerPrefetchCount');
});

/**
 * Exchange.setup(): Test RabbitMQ connection
 */
test('Exchange.setup(): Test RabbitMQ connection', async () => {
  const config = require('../../config');

  const testX = new Exchange(config);
  const connected = await testX.setup();
  connected.should.be.true;
});

/**
 * Exchange.setup(): Make sure exchange is created with expected params
 */
test('Exchange.setup(): Make sure exchange is created with expected params', async () => {
  const config = require('../../config');

  // Cpopy config object to override exchange with incorrect setting.
  const topologyTestXName = 'topologyTestX';
  const topologyTestXConfig = Object.assign({}, config, {});
  topologyTestXConfig.amqp.exchange = topologyTestXName;

  const topologyTestX = new Exchange(topologyTestXConfig);
  await topologyTestX.setup();

  // Test queue settings with RabbitMQ Management Plugin API.
  const rabbit = new RabbitManagement(config.amqpManagement);
  const topologyTestXInfo = await rabbit.getExchangeInfo(topologyTestXName);

  topologyTestXInfo.should.have.property('name', topologyTestXName);
  topologyTestXInfo.should.have.property('type', 'topic');
  topologyTestXInfo.should.have.property('vhost', config.amqp.vhost);
  topologyTestXInfo.should.have.property('durable', true);
  topologyTestXInfo.should.have.property('auto_delete', false);
  topologyTestXInfo.should.have.property('internal', false);
});


/**
 * Exchange.assertQueue(): Test queue with empty name to fail
 */
test('Exchange.assertQueue(): Test queue with empty name to fail', () => {
  // Previous implementation below is pointless.
  // TODO: reimplement by throwing error from Queue.setup() using stub.
  // Leaving the code commented out as an example.

  // class WrongNameQ extends Queue {}

  // const config = require('../../config');
  // const testX = new Exchange(config);
  // await testX.setup();

  // // Fake queue not initialized in Rabbit.
  // const wrongNameQ = new WrongNameQ(testX);
  // // Override Queue name and watch setup fail.
  // // Empty string would result in automatically generated queue name,
  // // thus Queue.setup() method will fail.
  // wrongNameQ.name = '';

  // console.dir(wrongNameQ, { colors: true, showHidden: true });

  // const incorrectSetupResult = wrongNameQ.setup();
  // await incorrectSetupResult.should.be.rejectedWith(
  //   Error,
  //   'Exchange.setup(): Queue assertion failed for ""',
  // );
});

// ------- End -----------------------------------------------------------------
