import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

test('UI 治理接受两种 CSS 引号，缺失或错误 token 导入仍拒绝', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'cms-ui-governance-'))
  const write = (file, text) => {
    mkdirSync(dirname(join(cwd, file)), { recursive: true })
    writeFileSync(join(cwd, file), text)
  }
  try {
    write('packages/ui/src/styles/tokens.css', ':root { --color-primary: blue; }')
    write(
      'packages/ui/package.json',
      JSON.stringify({ exports: { './styles/tokens.css': './src/styles/tokens.css' } })
    )
    write(
      'apps/frontend/crs/src/components/RenderNode.vue',
      '<script setup>import {} from "@cms/ui"</script>'
    )
    for (const name of ['element-deep-override', 'element-selector', 'important-override']) {
      write(`docs/${name}-allowlist.txt`, '')
    }
    for (const [source, expected] of [
      ['@import "@cms/ui/styles/tokens.css";', 0],
      ["@import '@cms/ui/styles/tokens.css';", 0],
      ['', 1],
      ["@import '@cms/ui/styles/wrong.css';", 1],
      ['/* @import "@cms/ui/styles/tokens.css"; */', 1]
    ]) {
      for (const app of ['cms', 'crs']) write(`apps/frontend/${app}/src/styles/main.css`, source)
      const result = spawnSync(
        process.execPath,
        [fileURLToPath(new URL('../check-ui-governance.mjs', import.meta.url))],
        { cwd, encoding: 'utf8' }
      )
      assert.equal(result.status, expected, `${source}\n${result.stdout}${result.stderr}`)
    }
  } finally {
    rmSync(cwd, { recursive: true })
  }
})
