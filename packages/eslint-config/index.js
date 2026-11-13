import js from '@eslint/js'
import globals from 'globals'
import prettier from 'eslint-config-prettier'

/** @type {import('eslint').Linter.Config} */
export default {
  ...js.configs.recommended,
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    globals: {
      ...globals.es2021
    }
  },
  rules: {
    ...js.configs.recommended.rules,
    ...prettier.rules,
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ]
  }
}
