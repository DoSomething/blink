'use strict';

const config = {
  conversationsBaseUri: process.env.GAMBIT_CONVERSATIONS_API_BASEURI || 'http://localhost:5100/api/v2',
  // TODO: Fix this typo.
  converationsApiKey: process.env.GAMBIT_CONVERSATIONS_API_KEY || 'dG90YWxseXNlY3JldA==',
  broadcastSpeedLimit: process.env.GAMBIT_BROADCAST_SPEED_LIMIT || 50,
  // Conversations v1 URL to be deprecated:
  converationsBaseUrl: process.env.GAMBIT_CONVERSATIONS_BASE_URL || 'http://localhost:5100/api/v1',
  // Gambit Campaigns variables to be deprecated:
  baseUrl: process.env.GAMBIT_API_BASE_URL || 'http://localhost:5000/v1',
  apiKey: process.env.GAMBIT_API_KEY || 'totallysecret',
};

module.exports = config;
