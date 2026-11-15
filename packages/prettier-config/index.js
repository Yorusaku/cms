/** @type {import('prettier').Config} */
export default {
  singleQuote: true,
  semi: false,
  printWidth: 100,
  trailingComma: 'none',
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  vueIndentScriptAndStyle: false,
  // Windows 检出是 CRLF、CI 是 LF；固定 lf 会让本地 format:check 全是假阳性
  endOfLine: 'auto'
}
