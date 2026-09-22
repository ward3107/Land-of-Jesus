import react from '@communitydirect/eslint-config/react';

export default [
  ...react,
  {
    rules: {
      // React 17+ automatic runtime — no need to import React in scope.
      'no-undef': 'off',
    },
  },
];
