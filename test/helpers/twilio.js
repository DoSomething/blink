'use strict';

const crypto = require('crypto');

/**
 * getTwilioSignature
 * Based on @see https://www.twilio.com/docs/libraries/reference/twilio-node/3.13.0/webhooks_webhooks.js.html
 *
 * @param  {string} url
 * @param  {object} msg
 * @return {string}
 */
module.exports.getTwilioSignature = function getTwilioSignature(token, url, msg) {
  let parsedUrl = url;
  Object.keys(msg).sort().forEach((key) => {
    parsedUrl = parsedUrl + key + msg[key];
  });
  return crypto.createHmac('sha1', token).update(new Buffer(parsedUrl, 'utf-8')).digest('Base64');
};
