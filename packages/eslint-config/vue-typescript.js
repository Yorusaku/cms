import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import baseConfig from './index.js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  baseConfig,
  {
    files: ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parser: tsParser,
        extraFileExtensions: ['.vue']
      }
    },
    plugins: {
      vue,
      '@typescript-eslint': tsPlugin
    },
    rules: {
      // Vue 相关规则
      'vue/multi-word-component-names': 'warn',
      'vue/no-v-html': 'warn',
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      // TypeScript 相关规则
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-this-alias': 'warn',
      // JavaScript 基础规则
      'no-unused-vars': 'off'
    }
  },
  {
    files: ['**/__tests__/**', '**/*.test.{j,t}s?(x)'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
]
