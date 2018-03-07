'use strict';

async function forbidden(ctx, next) {
  try {
    await next();
  } catch (err) {
    if (err.status === 403) {
      ctx.status = 403;
      // Doctor Who Easter Egg
      // Copyright info: http://tardis.wikia.com/wiki/File:Angel_bares_fangs.jpg
      ctx.set('Content-type', 'text/html');
      ctx.body = 'Don\'t blink!<br /><img src="https://vignette4.wikia.nocookie.net/tardis/images/1/1d/Angel_bares_fangs.jpg/revision/latest/scale-to-width-down/640?cb=20120607033826">';
    } else {
      throw err;
    }
  }
}

module.exports = forbidden;
