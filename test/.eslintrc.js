module.exports = {
  extends: '@dosomething/eslint-config/server/ava',
  rules: {
    // Allow all common iterator names as well as `t` for tests
    'id-length': ['error', { exceptions: ['t', 'i', 'j', 'k'] }],
    // Allow i++ in fors
    'no-plusplus': ['error', { 'allowForLoopAfterthoughts': true }],
    // Disable ForInStatement and ForOfStatement errors.
    // We don't care about so-called "heavyweight" operations in tests.
    // They are native to node.
    // https://github.com/airbnb/javascript/blob/master/packages/eslint-config-airbnb-base/rules/style.js#L303
    // https://eslint.org/docs/rules/no-restricted-syntax
    'no-restricted-syntax': [
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
  },
};
