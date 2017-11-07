'use strict';

const fetch = require('node-fetch');
const logger = require('winston');
const Twilio = require('twilio');


const BlinkRetryError = require('../errors/BlinkRetryError');
const Worker = require('./Worker');

class CustomerIoSmsBroadcastRelayWorker extends Worker {
  constructor(blink) {
    super(blink);
    this.blink = blink;
    this.twilioClient = new Twilio(
      this.blink.config.twilio.accountSid,
      this.blink.config.twilio.authToken,
    );

    this.baseURL = this.blink.config.gambit.converationsBaseUrl;
    this.apiKey = this.blink.config.gambit.converationsApiKey;

    // Bind process method to queue context
    this.consume = this.consume.bind(this);
  }

  setup() {
    this.queue = this.blink.queues.customerioSmsBroadcastRelayQ;
  }

  async consume(message) {
    let twilioResponse;
    const twilioRequest = {
      body: message.getBody(),
      to: message.getPhoneNumber(),
      messagingServiceSid: this.blink.config.twilio.serviceSid,
    };

    let messageSid;

    // Don't resend twilio sms on retries.
    if (message.getMessageSid() || message.getRetryAttempt() > 0) {
      messageSid = message.getMessageSid();
    } else {
      try {
        twilioResponse = await this.twilioClient.messages.create(twilioRequest);
        messageSid = twilioResponse.sid;
      } catch (error) {
        const meta = {
          env: this.blink.config.app.env,
          code: 'error_customerio_sms_relay_twilio_bad_client_response',
          worker: this.constructor.name,
          request_id: message ? message.getRequestId() : 'not_parsed',
        };

        logger.log('warning', error.toString(), meta);
        return false;
      }
    }

    if (!messageSid) {
      const meta = {
        env: this.blink.config.app.env,
        code: 'error_customerio_sms_relay_twilio_sid_not_parsed',
        worker: this.constructor.name,
        request_id: message ? message.getRequestId() : 'not_parsed',
      };

      logger.log('warning', 'Message Sid is not available in Twilio response', meta);
      return false;
    }

    // Save message sid to the message to avoid retries.
    message.setMessageSid(messageSid);

    // Fake delivery reciept.
    const data = {
      To: message.getPhoneNumber(),
      Body: message.getBody(),
      MessageStatus: 'delivered',
      MessageSid: messageSid,
    };
    const body = JSON.stringify(data);
    const headers = this.getRequestHeaders(message);
    const response = await fetch(
      `${this.baseURL}/import-message?broadcastId=${message.getBroadcastId()}`,
      {
        method: 'POST',
        headers,
        body,
      },
    );

    if (response.status === 200) {
      this.log(
        'debug',
        message,
        response,
        'success_customerio_sms_relay_gambit_response_200',
      );
      return true;
    }

    if (this.checkRetrySuppress(response)) {
      this.log(
        'debug',
        message,
        response,
        'success_customerio_sms_relay_gambit_retry_suppress',
      );
      return true;
    }

    if (response.status === 422) {
      this.log(
        'warning',
        message,
        response,
        'error_customerio_sms_relay_gambit_response_422',
      );
      return false;
    }


    this.log(
      'warning',
      message,
      response,
      'error_customerio_sms_relay_gambit_response_not_200_retry',
    );

    throw new BlinkRetryError(
      `${response.status} ${response.statusText}`,
      message,
    );
  }

  async log(level, message, response, code = 'unexpected_code') {
    const cleanedBody = (await response.text()).replace(/\n/g, '\\n');

    const meta = {
      env: this.blink.config.app.env,
      code,
      worker: this.constructor.name,
      request_id: message ? message.getRequestId() : 'not_parsed',
      response_status: response.status,
      response_status_text: `"${response.statusText}"`,
    };
    // Todo: log error?
    logger.log(level, cleanedBody, meta);
  }

  getRequestHeaders(message) {
    const headers = {
      Authorization: `Basic ${this.apiKey}`,
      'X-Request-ID': message.getRequestId(),
      'Content-type': 'application/json',
    };

    if (message.getRetryAttempt() > 0) {
      headers['x-blink-retry-count'] = message.getRetryAttempt();
    }

    return headers;
  }

  checkRetrySuppress(response) {
    // TODO: create common helper
    const headerResult = response.headers.get(this.blink.config.app.retrySuppressHeader);
    if (!headerResult) {
      return false;
    }
    return headerResult.toLowerCase() === 'true';
  }
}

module.exports = CustomerIoSmsBroadcastRelayWorker;
