#!/usr/bin/env node
import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, delimiter } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const dotOnly = '.' + 'only'
const dotSkip = '.' + 'skip'
const orTrue = '|' + '| true'
const bareDisable = 'eslint' + '-disable'

function fixture() {
  const cwd = mkdtempSync(join(tmpdir(), 'cms-agent-guards-'))
  const git = (...args) =>
    execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    })
  const write = (file, content) => {
    mkdirSync(dirname(join(cwd, file)), { recursive: true })
    writeFileSync(join(cwd, file), content)
  }
  git('init', '-q')
  git('config', 'user.name', 'guard-test')
  git('config', 'user.email', 'guard-test@example.invalid')
  write('package.json', JSON.stringify({ name: 'guard-fixture', private: true }))
  write('apps/frontend/cms/example.test.vue', 'export const baseline = 1;\n')
  git('add', '-A')
  git('commit', '-qm', 'fixture baseline')
  const run = (script, args = [], env = {}) =>
    spawnSync(process.execPath, [join(root, 'scripts/agent', script), ...args], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, PR_LABELS: '', ...env }
    })
  const check = (label, result, expected) => {
    console.log(
      `${label}: exit=${result.status}\n${result.stdout || ''}${result.stderr || ''}${result.error?.message || ''}`
    )
    assert.equal(result.status, expected, label)
  }
  const cleanup = () => {
    assert.equal(dirname(cwd), resolve(tmpdir()))
    rmSync(cwd, { recursive: true })
  }
  return { cwd, git, write, run, check, cleanup }
}

test('跳过检查：Vue、四类写法、暂存区与 PR diff', () => {
  const f = fixture()
  try {
    const file = 'apps/frontend/cms/example.test.vue'
    const violations = [
      `it${dotOnly}('case', () => {});`,
      `describe${dotSkip}('case', () => {});`,
      `test${dotOnly}.each([])('case', () => {});`,
      `check ${orTrue}`,
      `/* ${bareDisable} */`,
      `// ${bareDisable}-next-line`,
      'x' + 'it("case", () => {});'
    ]
    for (const [index, violation] of violations.entries()) {
      f.write(file, violation + '\n')
      f.git('add', file)
      f.check(`违规 ${index + 1}`, f.run('check-skips.mjs', ['--staged']), 1)
    }
    f.git('commit', '-qm', 'fixture violation')
    f.check('PR diff 违规', f.run('check-skips.mjs', [], { BASE_REF: 'HEAD~1' }), 1)
    f.write(file, `export const clean = 2; // ${bareDisable}-line no-console -- fixture\n`)
    f.git('add', file)
    f.write(file, `it${dotSkip}('unstaged', () => {});\n`)
    f.check('干净 index，不读取工作区违规', f.run('check-skips.mjs', ['--staged']), 0)
    f.check('无 PR diff', f.run('check-skips.mjs', [], { BASE_REF: 'HEAD' }), 0)
    f.check(
      '基线不存在时拒绝放行',
      f.run('check-skips.mjs', [], { BASE_REF: 'missing-fixture-ref' }),
      1
    )
  } finally {
    f.cleanup()
  }
})

test('依赖检查：根、嵌套 app、package、四类依赖、批准与损坏 JSON', () => {
  const f = fixture()
  try {
    const changes = [
      ['package.json', 'optionalDependencies'],
      ['apps/frontend/cms/package.json', 'devDependencies'],
      ['apps/backend/package.json', 'peerDependencies'],
      ['packages/utils/package.json', 'dependencies']
    ]
    for (const [file, field] of changes) {
      f.write(file, JSON.stringify({ name: 'guard-fixture', [field]: { 'fixture-dep': '1.0.0' } }))
    }
    f.git('add', '-A')
    f.check('四类新增依赖被拦', f.run('check-deps.mjs', ['--staged']), 1)
    f.check('批准后放行', f.run('check-deps.mjs', ['--staged'], { PR_LABELS: 'deps-approved' }), 0)
    f.git('commit', '-qm', 'fixture dependencies')
    f.check('PR diff 新增被拦', f.run('check-deps.mjs', [], { BASE_REF: 'HEAD~1' }), 1)
    f.check('无新增依赖放行', f.run('check-deps.mjs', [], { BASE_REF: 'HEAD' }), 0)
    f.check(
      '基线不存在时拒绝放行',
      f.run('check-deps.mjs', [], { BASE_REF: 'missing-fixture-ref' }),
      1
    )
    f.write('apps/frontend/cms/package.json', '{invalid')
    f.git('add', 'apps/frontend/cms/package.json')
    f.check('无效 JSON 不得当空包', f.run('check-deps.mjs', ['--staged']), 1)
  } finally {
    f.cleanup()
  }
})

test('pre-commit：真实 hook 拦违规，干净文件经现有 lint-staged 放行', () => {
  const f = fixture()
  try {
    for (const file of ['scripts/agent/check-skips.mjs', 'scripts/agent/check-deps.mjs']) {
      mkdirSync(dirname(join(f.cwd, file)), { recursive: true })
      copyFileSync(join(root, file), join(f.cwd, file))
    }
    f.write('lint-staged.config.mjs', 'export default { "*.txt": "node --version" };\n')
    const file = 'apps/frontend/cms/example.test.vue'
    // Windows 的 Git cmd 在 PATH 上，不代表 Git Bash 的 sh 也在 PATH 上。
    const shell =
      process.platform === 'win32'
        ? resolve(
            dirname(
              execFileSync('where.exe', ['git'], { encoding: 'utf8' }).trim().split(/\r?\n/)[0]
            ),
            '../bin/sh.exe'
          )
        : 'sh'
    const hookEnv = { ...process.env, PR_LABELS: '' }
    const pathKey = Object.keys(hookEnv).find(key => key.toLowerCase() === 'path') || 'PATH'
    hookEnv[pathKey] = join(root, 'node_modules/.bin') + delimiter + (hookEnv[pathKey] || '')
    const hook = () =>
      spawnSync(shell, [join(root, '.husky/pre-commit')], {
        cwd: f.cwd,
        encoding: 'utf8',
        env: hookEnv
      })
    f.write(file, `it${dotOnly}('case', () => {});\n`)
    f.git('add', file)
    f.check('hook 违规', hook(), 1)
    f.write(file, 'export const clean = 2;\n')
    f.write('clean.txt', 'fixture\n')
    f.git('add', file, 'clean.txt')
    f.check('hook 干净', hook(), 0)
  } finally {
    f.cleanup()
  }
})

test('依赖检查：兼容带 UTF-8 BOM 的历史 package.json', () => {
  const f = fixture()
  try {
    f.write('package.json', '\uFEFF' + JSON.stringify({ name: 'guard-fixture', private: true }))
    f.git('add', 'package.json')
    f.git('commit', '-qm', 'fixture BOM baseline')
    f.write(
      'package.json',
      '\uFEFF' +
        JSON.stringify({
          name: 'guard-fixture',
          private: true,
          devDependencies: { 'fixture-dep': '1.0.0' }
        })
    )
    f.git('add', 'package.json')
    f.check('BOM 包的新增依赖仍被拦', f.run('check-deps.mjs', ['--staged']), 1)
    f.check(
      'BOM 基线和当前包可解析并接受批准',
      f.run('check-deps.mjs', ['--staged'], { PR_LABELS: 'deps-approved' }),
      0
    )
  } finally {
    f.cleanup()
  }
})
