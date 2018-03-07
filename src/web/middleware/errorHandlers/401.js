'use strict';

async function notAuthorized(ctx, next) {
  try {
    await next();
  } catch (err) {
    if (err.status === 401) {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic');
      // Doctor Who Easter Egg
      // Copyright info: http://tardis.wikia.com/wiki/File:Angel_bares_fangs.jpg
      ctx.set('Content-type', 'text/html');
      ctx.body = 'Don\'t blink!<br /><img src="https://vignette4.wikia.nocookie.net/tardis/images/1/1d/Angel_bares_fangs.jpg/revision/latest/scale-to-width-down/640?cb=20120607033826">';
    } else {
      throw err;
    }
  }
}

module.exports = notAuthorized;
