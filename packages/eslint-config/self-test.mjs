import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { ESLint } from 'eslint'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import baseConfig from './index.js'
import typescriptConfig from './typescript.js'
import vueConfig from './vue.js'

const eslint = new ESLint()
const config = async file => {
  // 同时走 CLI，避免只验证配置对象而漏掉 flat config 的合并结果。
  const printed = execFileSync(
    process.execPath,
    [
      fileURLToPath(new URL('../bin/eslint.js', import.meta.resolve('eslint'))),
      '--print-config',
      file
    ],
    { encoding: 'utf8' }
  )
  return JSON.parse(printed)
}

test('实际文件的 parser、运行环境与 warning 等级', async () => {
  const vue = await config('apps/frontend/cms/src/views/Home.vue')
  const ts = await config('apps/frontend/cms/src/utils/auth.ts')
  const backend = await config('apps/backend/src/main.ts')
  const unit = await config('packages/utils/__tests__/expression.test.ts')
  const jest = await config('apps/backend/test/health.controller.spec.ts')
  const script = await config('apps/frontend/crs/postcss.config.js')
  const e2e = await config('apps/frontend/cms/tests/e2e/smoke-core.spec.ts')
  assert.match(vue.languageOptions.parser, /vue-eslint-parser/)
  assert.match(ts.languageOptions.parser, /typescript-eslint\/parser/)
  assert.match(backend.languageOptions.parser, /typescript-eslint\/parser/)
  assert.match(script.languageOptions.parser, /espree/)
  assert.equal(vue.languageOptions.globals.window, false)
  assert.equal(vue.languageOptions.globals.process, undefined)
  assert.equal(backend.languageOptions.globals.process, false)
  assert.equal(backend.languageOptions.globals.window, undefined)
  assert.equal(script.languageOptions.globals.process, false)
  assert.equal(script.languageOptions.globals.window, undefined)
  assert.equal(unit.languageOptions.globals.window, false)
  assert.equal(unit.languageOptions.globals.vi, false)
  assert.equal(jest.languageOptions.globals.jest, false)
  assert.equal(jest.languageOptions.globals.window, undefined)
  assert.equal(e2e.languageOptions.globals.window, undefined)
  assert.equal(e2e.languageOptions.globals.vi, undefined)
  assert.equal(ts.rules['no-undef'][0], 0)
  assert.equal(ts.rules['no-dupe-keys'][0], 0)
  assert.equal(ts.rules['no-constant-condition'][0], 2)
  assert.equal(vue.rules['vue/no-v-html'][0], 1)
  assert.equal(vue.rules['vue/multi-word-component-names'][0], 1)
  assert.equal(ts.rules['@typescript-eslint/no-explicit-any'][0], 1)
  assert.equal(ts.rules['no-console'][0], 1)
  assert.equal(unit.rules['@typescript-eslint/no-explicit-any'][0], 0)
  assert.equal(jest.rules['@typescript-eslint/no-explicit-any'][0], 1)
})

test('真实违规被拦截，干净代码放行', async () => {
  const lint = async (filePath, source) => (await eslint.lintText(source, { filePath }))[0]
  const js = await lint('scripts/quality-fixture.mjs', 'export const value = { key: 1, key: 2 };\n')
  assert.ok(js.messages.some(m => m.ruleId === 'no-dupe-keys' && m.severity === 2))
  const backend = await lint('apps/backend/src/quality-fixture.ts', 'export const value = "\\a"\n')
  assert.ok(backend.messages.some(m => m.ruleId === 'no-useless-escape' && m.severity === 2))
  const unused = await lint(
    'apps/frontend/cms/src/quality-fixture.ts',
    'import { ref } from "vue"\n'
  )
  assert.ok(unused.messages.some(m => m.ruleId === '@typescript-eslint/no-unused-vars'))
  const warning = await lint(
    'apps/frontend/cms/src/QualityFixture.vue',
    '<script setup lang="ts">const value: any = "ok"</script><template><div v-html="value" /></template>'
  )
  assert.ok(warning.messages.some(m => m.ruleId === 'vue/no-v-html' && m.severity === 1))
  assert.ok(
    warning.messages.some(
      m => m.ruleId === '@typescript-eslint/no-explicit-any' && m.severity === 1
    )
  )
  for (const [file, source] of [
    ['scripts/quality-fixture.mjs', 'export const value = process.version\n'],
    [
      'apps/frontend/cms/src/quality-fixture.ts',
      'export const value: string = window.location.href\n'
    ],
    ['apps/backend/src/quality-fixture.ts', 'export const value: string = process.version\n'],
    [
      'apps/frontend/cms/src/QualityFixture.vue',
      '<script setup lang="ts">const value: string = "ok"</script><template><div>{{ value }}</div></template>'
    ]
  ])
    assert.deepEqual((await lint(file, source)).messages, [], file)
})

test('三个公开单配置导出仍可直接使用', async () => {
  for (const [config, filePath, source] of [
    [baseConfig, 'fixture.js', 'export const value = 1'],
    [typescriptConfig, 'fixture.ts', 'export const value: number = 1'],
    [vueConfig, 'QualityFixture.vue', '<template><div>ok</div></template>']
  ]) {
    const instance = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [{ ...config, files: ['**/*.{js,ts,vue}'] }]
    })
    assert.deepEqual((await instance.lintText(source, { filePath }))[0].messages, [])
  }
})
