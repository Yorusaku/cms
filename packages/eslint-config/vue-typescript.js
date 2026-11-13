import globals from 'globals'
import baseConfig from './index.js'
import typescriptConfig from './typescript.js'
import vueConfig from './vue.js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  baseConfig,
  { ...typescriptConfig, files: ['**/*.{ts,tsx}'] },
  {
    ...vueConfig,
    files: ['**/*.vue'],
    plugins: { ...typescriptConfig.plugins, ...vueConfig.plugins },
    rules: { ...vueConfig.rules, ...typescriptConfig.rules }
  },
  {
    files: ['apps/frontend/**/src/**', 'packages/{hooks,ui,utils}/src/**'],
    languageOptions: { globals: globals.browser }
  },
  {
    files: [
      'apps/backend/**',
      '**/*.{config,conf}.{js,ts,mjs,cjs}',
      '**/scripts/**',
      'scripts/**',
      'packages/{eslint-config,prettier-config}/**',
      'eslint.config.js',
      'lint-staged.config.js',
      '.prettierrc.mjs'
    ],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' }
  },
  {
    files: ['**/__tests__/**', '**/*.{test,spec}.{js,jsx,ts,tsx}', '**/test/**', '**/tests/**'],
    languageOptions: { globals: globals.node }
  },
  {
    files: ['**/__tests__/**', '**/*.test.{j,t}s?(x)'],
    rules: { 'no-console': 'off', '@typescript-eslint/no-explicit-any': 'off' }
  },
  {
    files: [
      'apps/frontend/**/tests/**',
      'apps/frontend/**/src/tests/**',
      'packages/**/__tests__/**',
      'packages/test-utils/src/**'
    ],
    ignores: ['**/tests/e2e*/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } }
  },
  {
    files: [
      'apps/frontend/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'packages/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    ignores: ['**/tests/e2e*/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.vitest } }
  },
  {
    files: ['apps/backend/test/**', 'apps/backend/**/*.spec.ts'],
    languageOptions: { globals: globals.jest }
  }
]
