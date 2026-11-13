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
const patterns = [
  [/\.(only|skip)(?:\s*\.\s*each)?\s*(?:\(|`)/, '移除测试聚焦或跳过'],
  [/\b(xit|xdescribe|fit|fdescribe)\s*\(/, '移除测试聚焦或跳过别名'],
  [/\|\|\s*true\b/, '不要吞掉命令失败'],
  [/eslint-disable(?:-next-line|-line)?\s*(?:\*\/|-->)?\s*$/, 'eslint-disable 必须指定规则名']
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
      for (const [pattern, hint] of patterns) {
        if (pattern.test(content)) hits.push(`${file}:${lineNumber} ${hint}`)
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
