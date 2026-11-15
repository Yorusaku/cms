#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

const staged = process.argv.includes('--staged')
const base = process.env.BASE_REF || 'origin/main'
const globs = [
  '*.ts',
  '*.tsx',
  '*.js',
  '*.jsx',
  '*.mjs',
  '*.cjs',
  '*.vue',
  '*.json',
  '*.yml',
  '*.yaml',
  '*.sh',
  '*.ps1',
  '.husky/*'
]
/**
 * 聚焦/跳过只对测试文件生效。
 * TypeORM 的 `.skip(n)`、`.take(n)` 是合法的分页 API，全量匹配会误伤业务代码。
 */
const isTestFile = file => /(__tests__\/|\.(test|spec)\.)/.test(file)

const patterns = [
  {
    re: /\.(only|skip)(?:\s*\.\s*each)?\s*(?:\(|`)/,
    hint: '移除测试聚焦或跳过',
    testsOnly: true
  },
  {
    re: /\b(xit|xdescribe|fit|fdescribe)\s*\(/,
    hint: '移除测试聚焦或跳过别名',
    testsOnly: true
  },
  { re: /\|\|\s*true\b/, hint: '不要吞掉命令失败' },
  {
    re: /eslint-disable(?:-next-line|-line)?\s*(?:\*\/|-->)?\s*$/,
    hint: 'eslint-disable 必须指定规则名'
  }
]

try {
  // 暂存区读取 index；CI 读取 PR 新增行。均不读取工作区替代 index 的内容。
  const range = staged ? ['--cached'] : [`${base}...HEAD`]
  const diff = execFileSync(
    'git',
    ['diff', ...range, '--no-ext-diff', '--unified=0', '--', ...globs],
    {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe']
    }
  )
  const hits = []
  let file = ''
  let lineNumber = 0
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) file = line.slice(6)
    const hunk = /^@@ .* \+(\d+)/.exec(line)
    if (hunk) lineNumber = Number(hunk[1])
    if (line.startsWith('+') && !line.startsWith('+++')) {
      const content = line.slice(1).trimEnd()
      for (const { re, hint, testsOnly } of patterns) {
        if (testsOnly && !isTestFile(file)) continue
        if (re.test(content)) hits.push(`${file}:${lineNumber} ${hint}`)
      }
      lineNumber += 1
    } else if (line.startsWith(' ')) lineNumber += 1
  }
  if (hits.length) {
    console.error(hits.join('\n'))
    process.exitCode = 1
  } else console.log('新增行未出现削弱检查的写法，放行。')
} catch {
  console.error(`无法读取 ${staged ? '暂存区' : `基线 ${base}`} 的 diff，拒绝放行。`)
  process.exitCode = 1
}
