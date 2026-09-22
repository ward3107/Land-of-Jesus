import globals from 'globals';
import base from './base.js';

/** Base config extended with browser/React globals for app packages. */
export default [
  ...base,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
];
