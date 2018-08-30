'use strict';

module.exports = {
  authStrategies: {
    clientCredentials: {
      defaults: {
        tickerInterval: 1000, // milliseconds
        reconnectWaitPeriod: 10000, // milliseconds
        autoRenewToken: true,
        renewWindow: 60, // seconds
      },
      /**
       * admin user write - required to update users with client credentials flow.
       */
      scopes: process.env.DS_NORTHSTAR_API_OAUTH_SCOPES,
      /**
       * @see https://www.npmjs.com/package/simple-oauth2#options
       */
      credentials: {
        client: {
          id: process.env.DS_NORTHSTAR_API_OAUTH_CLIENT_ID,
          secret: process.env.DS_NORTHSTAR_API_OAUTH_CLIENT_SECRET,
        },
        auth: {
          tokenHost: process.env.DS_NORTHSTAR_API_OAUTH_TOKEN_HOST,
          tokenPath: process.env.DS_NORTHSTAR_API_OAUTH_TOKEN_PATH,
        },
        options: {
          bodyFormat: 'json',
        },
      },
    },
  },
};
