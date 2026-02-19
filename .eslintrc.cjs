module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
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
    // Vue相关规则
    'vue/multi-word-component-names': 'warn',
    'vue/no-v-html': 'warn',
    // 让 Prettier 处理自闭合标签
    'vue/html-self-closing': 'off',
    // 让 Prettier 处理属性换行
    'vue/max-attributes-per-line': 'off',
    
    // TypeScript相关规则
    '@typescript-eslint/no-unused-vars': ['error', { 
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_' 
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-types': 'warn',
    '@typescript-eslint/no-this-alias': 'warn',
    
    // JavaScript基础规则
    'no-unused-vars': 'off', // 使用TS版本
    'no-console': ['warn', { 'allow': ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // 导入相关
    'import/order': 'off' // 如果需要可以添加eslint-plugin-import
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
