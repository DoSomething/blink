'use strict';

const config = {
  baseURL: process.env.DS_NORTHSTAR_API_BASE_URL,
  emailUnsubscribed: {
    property: 'email_subscription_status',
    value: false,
  },
  userUpdateSpeedLimit: process.env.DS_NORTHSTAR_API_USER_UPDATE_SPEED_LIMIT || 10,
};

module.exports = config;
