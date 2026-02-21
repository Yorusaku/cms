/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './index.cjs',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
    extraFileExtensions: ['.vue']
  },
  plugins: ['vue', '@typescript-eslint'],
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
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',

    // JavaScript 基础规则
    'no-unused-vars': 'off'
  },
  overrides: [
    {
      files: ['*.test.{j,t}s?(x)', '**/__tests__/**'],
      env: {
        jest: true
      },
      rules: {
        'no-console': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      }
    }
  ]
}
