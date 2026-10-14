import cmsConfigs from '@cms/eslint-config/vue-typescript'

/**
 * @type {import('eslint').Linter.Config[]}
 *
 * 注意：flat config 会按「单个 config 对象」解析规则，
 * 只写 `rules` 而不在该对象里注册对应插件会报 `Could not find plugin "vue"`。
 * 因此这里不再重复声明 `vue/*` 规则（已在 @cms/eslint-config/vue-typescript 中注册并配置）；
 * 如需追加项目级覆盖，请把规则写在带 `plugins` 的对象里。
 */
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
  ...cmsConfigs
]
