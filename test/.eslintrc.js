module.exports = {
  extends: '@dosomething/eslint-config/nodejs/ava',
  rules: {
    // Allow skipping for now.
    // TODO: remove this override when the refactoring is complete.
    'ava/no-skip-test': 'off',
  },
};
