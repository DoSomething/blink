module.exports = {
  extends: '@dosomething/eslint-config/nodejs/8.x',
  globals: {
    // Support fetch mechanism through isomorphic-fetch module
    fetch: true,
    Response: true,
  },
};
