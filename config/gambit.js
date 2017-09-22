'use strict';

const config = {
  baseUrl: process.env.GAMBIT_API_BASE_URL || 'http://localhost:5000/v1',
  apiKey: process.env.GAMBIT_API_KEY || 'totallysecret',
  converationsBaseUrl: process.env.GAMBIT_CONVERSATIONS_BASE_URL || 'http://localhost:5100/api/v1',
  converationsApiKey: process.env.GAMBIT_CONVERSATIONS_API_KEY || 'dG90YWxseXNlY3JldA==',
  proxyConcurrency: parseInt(process.env.GAMBIT_PROXY_CONCURRENCY, 10) || 0,
};

module.exports = config;
