import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import baseConfig from './index.js'

/** @type {import('eslint').Linter.Config} */
export default {
  ...baseConfig,
  languageOptions: {
    ...baseConfig.languageOptions,
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    }
  },
  plugins: {
    '@typescript-eslint': tsPlugin
  },
  rules: {
    ...baseConfig.rules,
    ...tsPlugin.configs['eslint-recommended'].overrides[0].rules,
    'no-undef': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-this-alias': 'warn'
  }
}
