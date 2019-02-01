'use strict';

const { config } = require('./config');
// @see https://github.com/awslabs/aws-apigateway-lambda-authorizer-blueprints/blob/master/blueprints/nodejs/index.js
const { AuthPolicy } = require('./auth-policy');

function getApiKey(queryStringParams) {
  return queryStringParams[config.apiKeyQueryVarName];
}

function validateApiKey(apiKey) {
  return config.apiKeyQueryVarValue === apiKey;
}

function getPolicyOptions(eventRequestContext) {
  const options = {};
  options.restApiId = eventRequestContext.apiId;
  options.stage = eventRequestContext.stage;
  return options;
}

/**
 * This Lambda function will receive the request from the internet and will
 * authorize based on a Token.
 */

exports.handler = (event, context, callback) => {
  const apiKey = getApiKey(event.queryStringParameters);
  const isValidApiKey = validateApiKey(apiKey);
  const principalId = 'twilio';

  if (isValidApiKey) {
    const eventRequestContext = event.requestContext;
    const options = getPolicyOptions(eventRequestContext);
    // Generates a policy object to be constructed and built
    const policy = new AuthPolicy(principalId, eventRequestContext.accountId, options);
    // Allows the request to invoke this specific method on the specific resource
    policy.allowMethod(AuthPolicy.HttpVerb.POST, eventRequestContext.resourcePath);
    // Builds a policy that allows invocation of the API
    const authResponse = policy.build();
    callback(null, authResponse);
  } else {
    // Returns and unauthorized (401) error to the client
    callback('Unauthorized', null);
  }
};
