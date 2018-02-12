'use strict';

const config = {
  conversations: {
    // TODO: When we drop Broadcasts v1 support: rename config variable to BASE_URL
    // and remove v1BaseURL property.
    baseURL: process.env.GAMBIT_CONVERSATIONS_API_BASEURI || 'http://localhost:5100/api/v2',
    apiKey: process.env.GAMBIT_CONVERSATIONS_API_KEY || 'dG90YWxseXNlY3JldA==',
    v1BaseURL: process.env.GAMBIT_CONVERSATIONS_BASE_URL || 'http://localhost:5100/api/v1',
  },
  broadcastSpeedLimit: process.env.GAMBIT_BROADCAST_SPEED_LIMIT || 50,
};

module.exports = config;
