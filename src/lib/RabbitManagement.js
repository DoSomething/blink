'use strict';

const fetch = require('node-fetch');
const URL = require('url');

class RabbitManagement {
  constructor({ protocol, hostname, port, username, password, vhost }) {
    this.baseURL = URL.format({
      protocol,
      hostname,
      port,
      // Plugin rabbitmq_management API always lives under /api/
      pathname: '/api',
    });

    // Create basic auth header.
    this.authHeader = Buffer(`${username}:${password}`).toString('base64');

    // Expose AMQP vhost for building correct API endpoints.
    this.vhost = vhost;
  }

  async getQueueInfo(queueName) {
    const endpoint = `/queues/${this.vhost}/${queueName}`;
    let response = {};
    try {
      response = await this.get(endpoint);
    } catch (error) {
      // Wrap HTTP exceptions in meaningful response.
      throw new Error(`Incorrect RabbitManagement.getQueueInfo() response for GET ${endpoint}: ${error.message}`);
    }
    return response;
  }

  async getQueueBindings(queueName, exchangeName) {
    const endpoint = `/bindings/${this.vhost}/e/${exchangeName}/q/${queueName}`;
    const response = await this.get(endpoint);
    // API returns 200 and empty array when no bindings found.
    if (response.length < 1) {
      // Return false if queue is not bound to its exchange:
      // by design of this app a queue should have at least one valid route.
      return false;
    }
    return response;
  }

  async getMessagesFrom(queueName, count) {
    const endpoint = `/queues/${this.vhost}/${queueName}/get`;
    let response = {};
    try {
      response = await this.post(endpoint, {
        count,
        requeue: true,
        encoding: 'auto',
      });
    } catch (error) {
      // Wrap HTTP exceptions in meaningful response.
      throw new Error(`Incorrect RabbitManagement.getMessagesFrom() response for GET ${endpoint}: ${error.message}`);
    }
    return response;
  }

  async get(endpoint) {
    const options = this.getFetchDefaults();
    const fullUrl = this.fullUri(endpoint);
    const response = await fetch(fullUrl, options);
    return RabbitManagement.handleFetchResponse(response);
  }

  async post(endpoint, data) {
    const options = this.getFetchDefaults();
    options.method = 'POST';
    options.body = JSON.stringify(data);

    const response = await fetch(this.fullUri(endpoint), options);
    return RabbitManagement.handleFetchResponse(response);
  }

  static handleFetchResponse(response) {
    // Tolerate "200 OK" responses only.
    if (response.status !== 200) {
      throw new Error(`RabbitManagement.handleFetchResponse(): HTTP status ${response.status}: ${response.statusText}`);
    }

    // Always expect correct 200 response to have JSON body.
    return response.json();
  }

  fullUri(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  getFetchDefaults() {
    return {
      headers: {
        Authorization: `Basic ${this.authHeader}`,
      },
    };
  }
}

module.exports = RabbitManagement;
