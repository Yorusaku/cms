/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './index.cjs',
    'plugin:vue/vue3-recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },
  plugins: ['vue'],
  rules: {
    'vue/multi-word-component-names': 'warn',
    'vue/no-v-html': 'warn',
    'vue/html-self-closing': 'off',
    'vue/max-attributes-per-line': 'off'
  },
  overrides: [
    {
      files: ['*.test.{j,t}s?(x)', '**/__tests__/**'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off'
      }
    }
  ]
}
