'use strict';

const twilioClient = require('twilio');

const ForbiddenBlinkError = require('../../../../errors/ForbiddenBlinkError');
const logger = require('../../../../../config/logger');

/**
 * twilioSignature - middleware that authenticates requests from Twilio.
 * @see https://www.twilio.com/docs/api/security#validating-requests
 *
 * @param  {object} twilioConfig
 */
function twilioSignature(twilioConfig) {
  const authToken = twilioConfig.authToken;
  return function (ctx, next) {
    const signature = ctx.get('x-twilio-signature');
    // @see https://nodejs.org/api/url.html#url_the_whatwg_url_api
    const urlObj = ctx.request.URL;

    /**
     * While developing and using ngrok to tunnel requests from a real mobile to Blink's localhost.
     * Make sure both, the ngrok URL you use in the Twilio settings and the url it redirects to,
     * are using SSL. Otherwise the http scheme will mismatch (http:// VS https://) and will
     * invalidate the request.
     *
     * Alternatively. TEMPORARILY, manually hardcode the correct URL here.
     */
    const url = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    const payload = ctx.request.body;
    const valid = twilioClient.validateRequest(authToken, signature, url, payload);

    if (!valid) {
      const errorMessage = '403 Forbidden';

      const meta = {
        code: 'error_twilio_signature_invalid',
        messageSid: ctx.request.body.MessageSid,
        request_id: ctx.id,
        method: ctx.request.method,
        host: ctx.request.hostname,
        path: ctx.request.path,
        fwd: ctx.request.ip,
        protocol: ctx.request.protocol,
      };

      logger.log('error', errorMessage, { meta });
      throw new ForbiddenBlinkError(errorMessage);
    }

    return next();
  };
}

module.exports = twilioSignature;
