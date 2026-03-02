import cmsConfigs from '@cms/eslint-config/vue-typescript'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
      '**/auto-imports.d.ts',
      '**/components.d.ts'
    ]
  },
  ...cmsConfigs,
  {
    rules: {
      // 项目自定义规则覆盖
      'vue/multi-word-component-names': 'warn',
      'vue/no-v-html': 'warn'
    }
  }
]
