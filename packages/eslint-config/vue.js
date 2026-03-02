import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import prettier from 'eslint-config-prettier'
import baseConfig from './index.js'

/** @type {import('eslint').Linter.Config} */
export default {
  ...baseConfig,
  plugins: {
    vue
  },
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: '@typescript-eslint/parser',
      extraFileExtensions: ['.vue']
    }
  },
  rules: {
    ...baseConfig.rules,
    'vue/multi-word-component-names': 'warn',
    'vue/no-v-html': 'warn',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off'
  },
  ignores: ['**/__tests__/**', '**/*.test.{j,t}s?(x)']
}
