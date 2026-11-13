#!/usr/bin/env node
import { execFileSync } from 'node:child_process'

const staged = process.argv.includes('--staged')
const base = process.env.BASE_REF || 'origin/main'
const labels = (process.env.PR_LABELS || '').split(',').map(label => label.trim())
const fields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
const git = args =>
  execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  })

function readPackage(ref, file, optional = false) {
  const object = `${ref}:${file}`
  if (optional) {
    // 新文件在基线中不存在是正常情况；JSON 解析失败则不能当成空包放过。
    try {
      git(['cat-file', '-e', object])
    } catch {
      return {}
    }
  }
  return JSON.parse(git(['show', object]).replace(/^\uFEFF/, ''))
}

try {
  const beforeRef = staged
    ? git(['rev-parse', '--verify', 'HEAD']).trim()
    : git(['merge-base', base, 'HEAD']).trim()
  const range = staged ? ['--cached'] : [`${beforeRef}...HEAD`]
  const files = git([
    'diff',
    ...range,
    '--name-only',
    '-z',
    '--diff-filter=ACMRT',
    '--',
    'package.json',
    ':(glob)apps/**/package.json',
    ':(glob)packages/*/package.json'
  ])
    .split('\0')
    .filter(Boolean)
  const additions = []
  for (const file of files) {
    const before = readPackage(beforeRef, file, true)
    const after = readPackage(staged ? '' : 'HEAD', file)
    for (const field of fields) {
      for (const [name, version] of Object.entries(after[field] || {})) {
        if (!Object.hasOwn(before[field] || {}, name))
          additions.push(`${file} ${field}: ${name}@${version}`)
      }
    }
  }
  if (!additions.length) console.log('根目录、apps/**、packages/* 没有新增依赖，放行。')
  else if (labels.includes('deps-approved'))
    console.log(`deps-approved 批准 ${additions.length} 项新增依赖。`)
  else {
    console.error(`新增依赖缺少 deps-approved 批准：\n${additions.join('\n')}`)
    process.exitCode = 1
  }
} catch {
  console.error('依赖 diff、基线或 package.json 无法读取/解析，拒绝放行。')
  process.exitCode = 1
}
