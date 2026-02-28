'use strict';
const gtsConfig = require('gts');
const gtsIgnores = require('gts/eslint.ignores.js');
const {defineConfig} = require('eslint/config');

module.exports = defineConfig([
  {ignores: gtsIgnores},
  ...gtsConfig,
  {
    rules: {
      'spaced-comment': 'warn',
    },
  },
]);
