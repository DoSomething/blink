'use strict';

const fetch = require('node-fetch');
/**
 * Deep Extend is used because Object.assign does shallow-copy only. Nested objects are
 * referenced instead of copied which can bring unintended consequences.
 */
const deepExtend = require('deep-extend');

const gambitConfig = require('../../../../config/workers/lib/helpers/gambit-conversations');

// TODO: This helper is becoming too big, needs to be split into more defined responsibilities

/**
 * executeGet - Sends a GET requests to the v1MessagesBaseURL host and given path
 *
 * @param  {String} path
 * @param  {Object} opts = {} @see https://www.npmjs.com/package/node-fetch#options
 * @return {Promise}
 */
module.exports.executeGet = function executeGet(path, opts = {}) {
  const options = deepExtend({}, opts, {
    method: 'GET',
  });
  return fetch(`${gambitConfig.v1MessagesBaseURL}/${path}`, options);
};

/**
 * executeUpdate - Sends a PATCH request to the baseURL host and given path
 *
 * @param  {string} path
 * @param  {Object} opts = {} @see https://www.npmjs.com/package/node-fetch#options
 * @return {Promise}
 */
module.exports.executeUpdate = function executeUpdate(path, opts = {}) {
  const options = deepExtend({}, opts, {
    method: 'PATCH',
  });
  return fetch(`${gambitConfig.baseURL}/${path}`, options);
};

/**
 * executePost - Sends a POST request to the baseURL host and given path
 *
 * @param  {string} path
 * @param  {Object} opts = {} @see https://www.npmjs.com/package/node-fetch#options
 * @return {Promise}
 */
module.exports.executePost = function executePost(path, opts = {}) {
  const options = deepExtend({}, opts, {
    method: 'POST',
  });
  return fetch(`${gambitConfig.baseURL}/${path}`, options);
};

/**
 * getMessageIdBySidPath
 *
 * @param  {string} messageSid
 * @return {string}             path
 */
module.exports.getMessageIdBySidPath = function getMessageIdBySidPath(messageSid) {
  return `messages?query={"platformMessageId":"${messageSid}"}&select=id&limit=1`;
};

/**
 * getUpdateMessagePath
 *
 * @param  {string} messageId
 * @return {string}           path
 */
module.exports.getUpdateMessagePath = function getUpdateMessagePath(messageId) {
  return `messages/${messageId}`;
};

/**
 * getTwilioPath
 *
 * @see https://github.com/DoSomething/gambit-conversations/blob/master/documentation/endpoints/messages.md#twilio
 * @return {String}   G-Conversations inbound twilio message path
 */
module.exports.getTwilioPath = function getTwilioPath() {
  return 'messages?origin=twilio';
};

/**
 * getBroadcastPath
 *
 * @see https://github.com/DoSomething/gambit-conversations/blob/master/documentation/endpoints/messages.md#broadcast
 * @return {String}   G-Conversations broadcast message path
 */
module.exports.getBroadcastPath = function getBroadcastPath() {
  return 'messages?origin=broadcast';
};

/**
 * getBroadcastLitePath
 *
 * @see https://github.com/DoSomething/gambit-conversations/blob/master/documentation/endpoints/messages.md#broadcast-lite
 * @return {String}   G-Conversations broadcastLite message path
 */
module.exports.getBroadcastLitePath = function getBroadcastLitePath() {
  return 'messages?origin=broadcastLite';
};

/**
 * getCampaignSignupPath
 *
 * @see https://github.com/DoSomething/gambit-conversations/blob/master/documentation/endpoints/messages.md#signup
 * @return {String}   G-Conversations web campaign signup message path
 */
module.exports.getCampaignSignupPath = function getCampaignSignupPath() {
  return 'messages?origin=signup';
};

/**
 * getSubscriptionStatusActivePath
 *
 * @return {String}   G-Conversations web sms status active message path
 */
module.exports.getSubscriptionStatusActivePath = function getSubscriptionStatusActivePath() {
  return 'messages?origin=subscriptionStatusActive';
};

/**
 * relayMessage - relays an authenticated POST request to G-Conversations
 *
 * @param  {String} path        G-Conversations path to send the POST to
 * @param  {Message} message    A message instance
 * @param  {Object} opts        Object with properties to pass to the node-fetch client. This
 *                              includes the body property.
 * @see {@link https://www.npmjs.com/package/node-fetch#class-response|Response Class}
 * @return {Promise<Response>}
 */
module.exports.relayMessage = function relayMessage(path, message, opts) {
  const headers = exports.getRequestHeaders(message);
  return exports.executePost(path, Object.assign({ headers }, opts));
};

/**
 * relayTwilioInboundMessage - Relays Inbound Twilio messages to G-Conversations
 *
 * @param  {Message} message
 * @param  {Object} opts
 * @return {Promise<Response>}
 */
module.exports.relayTwilioInboundMessage = function relayTwilioInboundMessage(message, opts) {
  return exports.relayMessage(exports.getTwilioPath(), message, opts);
};

/**
 * relayBroadcastMessage - Relays Broadcast messages to G-Conversations
 *                         /v2/messages?origin=broadcast route
 *
 * @param  {Message} message
 * @param  {Object} opts
 * @return {Promise<Response>}
 */
module.exports.relayBroadcastMessage = function relayBroadcastMessage(message, opts) {
  return exports.relayMessage(exports.getBroadcastPath(), message, opts);
};

/**
 * relayBroadcastLiteMessage - Relays Broadcast message to G-Conversations
 *                             /v2/messages?origin=broadcastLite route
 * @param {*} message
 * @param {*} opts
 * @return {Promise<Response>}
 */
module.exports.relayBroadcastLiteMessage = function relayBroadcastLiteMessage(message, opts) {
  return exports.relayMessage(exports.getBroadcastLitePath(), message, opts);
};

/**
 * relayCampaignSignupMessage - Relays Web Campaign Signup messages to G-Conversations
 *
 * @param  {Message} message
 * @param  {Object} opts
 * @return {Promise<Response>}
 */
module.exports.relayCampaignSignupMessage = function relayCampaignSignupMessage(message, opts) {
  return exports.relayMessage(exports.getCampaignSignupPath(), message, opts);
};

/**
 * relaySmsStatusActiveMessage - Relays Sms Status Active welcome messages to G-Conversations
 *
 * @param  {Message} message
 * @param  {Object} opts
 * @return {Promise<Response>}
 */
module.exports.relaySmsStatusActiveMessage = function relaySmsStatusActiveMessage(message, opts) {
  return exports.relayMessage(exports.getSubscriptionStatusActivePath(), message, opts);
};

/**
 * getMessageIdBySid - Gets a message from Gambit Conversations by the messageSid.
 * The message contains an _id property when found.
 *
 * @async
 * @param  {string} messageSid           A Twilio message Sid.
 * @param  {Object} opts
 * @return {Promise}
 */
module.exports.getMessageIdBySid = async function getMessageIdBySid(messageSid, opts) {
  // @see https://www.npmjs.com/package/express-restify-mongoose
  const path = exports.getMessageIdBySidPath(messageSid);
  return exports.executeGet(path, opts);
};

/**
 * updateMessage - Updates a message in Gambit Conversations by the messageId.
 *
 * @async
 * @param  {String} messageId         Not a message instance. Just the message id.
 * @param  {Object} opts              Already includes the headers in the object.
 * @return {Promise}
 */
module.exports.updateMessage = async function updateMessage(messageId, opts) {
  const path = exports.getUpdateMessagePath(messageId);
  return exports.executeUpdate(path, opts);
};


/**
 * getMessageToUpdate
 *
 * @param  {type} message         A message instance.
 * @return {Promise}
 */
module.exports.getMessageToUpdate = async function getMessageToUpdate(message) {
  const messageSid = message.getData().MessageSid;
  const headers = exports.getRequestHeaders(message);
  return exports.getMessageIdBySid(messageSid, {
    headers,
  });
};

/**
 * getDeliveredAtUpdateBody
 *
 * @param {Object} messageData
 * @return {Object}  The metadata update to be sent to G-Conversations
 */
module.exports.getDeliveredAtUpdateBody = function getDeliveredAtUpdateBody(messageData) {
  return {
    metadata: {
      delivery: {
        deliveredAt: messageData.deliveredAt,
      },
    },
  };
};

/**
 * getFailedAtUpdateBody
 *
 * @param {Object} messageData
 * @return {Object}             The metadata update to be sent to G-Conversations
 */
module.exports.getFailedAtUpdateBody = function getFailedAtUpdateBody(messageData) {
  return {
    metadata: {
      delivery: {
        failedAt: messageData.failedAt,
        failureData: {
          code: messageData.ErrorCode,
          message: messageData.ErrorMessage,
        },
      },
    },
  };
};

/**
 * parseMessageIdFromBody - It parses the _id out of the given response body
 * from the G-Conversations v1/messages request.
 *
 *
 * WARNING: This method is coupled with G-Conversations implementation of the v1/messages route.
 * G-Conversations uses express-restify-mongoose, which sends the found tuples in an array.
 *
 * @param  {array} body description
 * @return {string}
 */
module.exports.parseMessageIdFromBody = function parseMessageIdFromBody(body) {
  if (!Array.isArray(body) || body.length <= 0) {
    throw new Error('parseMessageIdFromBody(): Non empty array expected in response');
  }
  return body[0]._id; // eslint-disable-line no-underscore-dangle
};

/**
 * getRequestHeaders - Get G-Conversations specific headers for this message
 *
 * @param  {Object} message
 * @return {Object}
 */
module.exports.getRequestHeaders = function getRequestHeaders(message) {
  const headers = {
    Authorization: `Basic ${gambitConfig.apiKey}`,
    'X-Request-ID': message.getRequestId(),
    'Content-type': 'application/json',
  };
  if (message.getRetryAttempt() > 0) {
    headers['x-blink-retry-count'] = message.getRetryAttempt();
  }
  return headers;
};
