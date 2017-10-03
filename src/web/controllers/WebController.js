'use strict';

const URL = require('url');
const logger = require('winston');

const MessageValidationBlinkError = require('../../errors/MessageValidationBlinkError');

class WebController {
  constructor(blink) {
    this.web = blink.config.web;
    this.blink = blink;
  }

  /**
   * A helper function that returns named route as full URL
   * @param  {String} name Named route avaiable in this.router
   * @return {String}      Full route URL
   */
  fullUrl(name) {
    let port = parseInt(this.web.port, 10);
    if (port === 80) {
      // Omit port 80 in URLs.
      port = null;
    }
    return URL.format({
      protocol: this.web.protocol,
      hostname: this.web.hostname,
      port,
      pathname: this.blink.web.router.url(name),
    });
  }

  sendOK(ctx, message, status = 202) {
    ctx.body = {
      ok: true,
      message: 'Message queued',
      code: 'success_message_queued',
    };
    // Accepted.
    ctx.status = status;
    this.log('info', ctx, message, ctx.body.code);
  }

  sendOKNoContent(ctx, message, status = 204) {
    ctx.body = '';
    ctx.status = status;
    this.log('info', ctx, message, 'success_message_queued');
  }

  sendError(ctx, error) {
    ctx.body = {
      // Not queued.
      ok: false,
    };

    // Check error type.
    let level;
    if (error instanceof MessageValidationBlinkError) {
      // Machine-readable error code.
      ctx.body.code = 'error_validation_failed';
      ctx.status = 422;
      level = 'warning';
    } else {
      ctx.body.code = 'error_unexpected_controller_error';
      ctx.status = 400;
      level = 'error';
    }
    ctx.body.message = error.toString();

    this.log(level, ctx, false, ctx.body.code);
  }

  log(level, ctx, message, code) {
    let text = ctx.body ? ctx.body.message : undefined;
    if (message) {
      text = `${text}, message ${message.toString()}`;
    }
    const meta = {
      env: this.blink.config.app.env,
      code,
      request_id: ctx.id,
      method: ctx.request.method,
      host: ctx.request.hostname,
      path: ctx.request.path,
      fwd: ctx.request.ip,
      protocol: ctx.request.protocol,
    };
    logger.log(level, text, meta);
  }
}

module.exports = WebController;
