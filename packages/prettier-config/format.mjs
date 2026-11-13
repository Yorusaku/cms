import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import prettier from 'prettier'

const write = process.argv.includes('--write')
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean)
let differences = 0
for (const file of files) {
  const info = await prettier.getFileInfo(file, { ignorePath: '.prettierignore' })
  if (info.ignored || !info.inferredParser) continue
  const source = await readFile(file, 'utf8')
  const options = { ...(await prettier.resolveConfig(file)), filepath: file }
  if (await prettier.check(source, options)) continue
  differences++
  console.log(file)
  if (write) await writeFile(file, await prettier.format(source, options))
}
console.log(`${write ? '已格式化' : '格式差异'}：${differences} 个文件`)
if (!write && differences) process.exitCode = 1
