'use strict';

const config = {
  conversations: {
    baseURL: process.env.GAMBIT_CONVERSATIONS_API_BASE_URL || 'http://localhost:5100/api/v2',
    apiKey: process.env.GAMBIT_CONVERSATIONS_API_KEY || 'dG90YWxseXNlY3JldA==',
  },
  broadcastSpeedLimit: process.env.GAMBIT_BROADCAST_SPEED_LIMIT || 50,
};

/**
 * TODO: This is a hack while we fix the version and routing discrepancy in G-Conversations
 */
config.conversations.v1MessagesBaseURL = config.conversations.baseURL.replace(/v2/, 'v1');

module.exports = config;
