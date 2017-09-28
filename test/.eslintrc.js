module.exports = {
  extends: '@dosomething/eslint-config/nodejs/ava',
  rules: {
    // Allow skipping for now.
    // TODO: remove this override when the refactoring is complete.
    'ava/no-skip-test': 'off',
    // Allow all common iterator names as well as `t` for tests
    'id-length': ['error', { exceptions: ['t', 'i', 'j', 'k'] }],
    // Allow i++ in fors
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
  },
};
