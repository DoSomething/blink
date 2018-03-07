'use strict';

const config = {
  conversations: {
    // TODO: rename config variable to BASE_URL for consistency.
    baseURL: process.env.GAMBIT_CONVERSATIONS_API_BASEURI || 'http://localhost:5100/api/v2',
    apiKey: process.env.GAMBIT_CONVERSATIONS_API_KEY || 'dG90YWxseXNlY3JldA==',
  },
  broadcastSpeedLimit: process.env.GAMBIT_BROADCAST_SPEED_LIMIT || 50,
};

module.exports = config;
