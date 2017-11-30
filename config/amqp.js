'use strict';

// See http://www.squaremobius.net/amqp.node/channel_api.html#connecting-with-an-object-instead-of-a-url
module.exports = {
  // AMQP connection settings.
  connection: {
    protocol: process.env.BLINK_AMQP_PROTOCOL || 'amqp',
    hostname: process.env.BLINK_AMQP_HOST || 'localhost',
    port: process.env.BLINK_AMQP_PORT || '5672',
    username: process.env.BLINK_AMQP_USER || 'blink',
    password: process.env.BLINK_AMQP_PASSWORD || 'blink',
    vhost: process.env.BLINK_AMQP_VHOST || 'blink',
  },
  settings: {
    topicExchange: process.env.BLINK_AMQP_TOPIC_EXCHANGE || 'blink-topic',
  },
};
