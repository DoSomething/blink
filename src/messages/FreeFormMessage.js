'use strict';

const Joi = require('joi');

const Message = require('./Message');

class FreeFormMessage extends Message {
  constructor(...args) {
    super(...args);

    this.schema = Joi.object()
      // Allow presence of all other keys.
      .unknown();
  }

  static fromCtx(ctx) {
    // TODO: save more metadata
    // TODO: metadata parse helper
    const freeFormMessage = new FreeFormMessage({
      data: ctx.request.body,
      meta: {
        request_id: ctx.id,
      },
    });
    return freeFormMessage;
  }
}

module.exports = FreeFormMessage;
