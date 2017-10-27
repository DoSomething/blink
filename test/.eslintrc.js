module.exports = {
  extends: '@dosomething/eslint-config/nodejs/ava',
  rules: {
    // Allow all common iterator names as well as `t` for tests
    'id-length': ['error', { exceptions: ['t', 'i', 'j', 'k'] }],
    // Allow i++ in fors
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
  },
};
