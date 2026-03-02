/**
 * 表达式求值器
 * 安全地执行表达式，支持变量引用和基本运算
 * 
 * 安全特性：
 * 1. 使用手动解析而非 eval/Function
 * 2. 只允许访问 $state, $props 中的属性
 * 3. 禁止危险函数
 */

// 危险属性列表
const DANGEROUS_PROPERTIES = [
  'constructor',
  '__proto__',
  'prototype',
  'caller',
  'callee',
  'arguments',
]

/**
 * 检查属性名是否安全
 */
function isSafeProperty(name: string): boolean {
  if (DANGEROUS_PROPERTIES.includes(name)) {
    return false
  }
  if (name.startsWith('__') && name.endsWith('__')) {
    return false
  }
  return true
}

/**
 * 安全地获取对象属性
 */
function safeGetProp(obj: unknown, key: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined
  }
  
  if (!isSafeProperty(key)) {
    return undefined
  }
  
  try {
    return (obj as Record<string, unknown>)[key]
  } catch {
    return undefined
  }
}

/**
 * 上下文类型定义
 */
export interface ExpressionContext {
  $state?: Record<string, unknown>
  $props?: Record<string, unknown>
  $event?: unknown
  $api?: Record<string, unknown>
}

/**
 * 从上下文中获取变量值
 * 支持 $state.xxx 和 $props.xxx 格式
 */
function getVariableValue(path: string, context: ExpressionContext): unknown {
  const segments = path.split('.')
  const firstSeg = segments[0]

  // 确定从哪个对象获取
  let source: Record<string, unknown> | undefined
  const stateObj = context.$state as Record<string, unknown> | undefined
  const propsObj = context.$props as Record<string, unknown> | undefined
  const eventObj = context.$event as Record<string, unknown> | undefined
  const apiObj = context.$api as Record<string, unknown> | undefined

  if (stateObj && firstSeg in stateObj) {
    source = stateObj
  } else if (propsObj && firstSeg in propsObj) {
    source = propsObj
  } else if (eventObj && firstSeg in eventObj) {
    source = eventObj
  } else if (apiObj && firstSeg in apiObj) {
    source = apiObj
  } else {
    source = stateObj
  }

  if (!source) {
    return undefined
  }

  // 遍历 segments 获取值
  let current: unknown = source
  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (typeof current !== 'object') {
      return undefined
    }

    current = safeGetProp(current, segment)
  }

  return current
}

/**
 * 解析字面量值
 */
function parseLiteral(trimmed: string): unknown {
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed)
  }

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (trimmed === 'undefined') return undefined

  return undefined
}

/**
 * 解析变量引用
 */
function parseVariableReference(trimmed: string, context: ExpressionContext): unknown {
  if (trimmed.match(/^\$state\.[a-zA-Z_$][a-zA-Z0-9_$.]*$/)) {
    return getVariableValue(trimmed.slice(7), context)
  }
  if (trimmed.match(/^\$props\.[a-zA-Z_$][a-zA-Z0-9_$.]*$/)) {
    return getVariableValue(trimmed.slice(7), context)
  }

  return undefined
}

/**
 * 解析并执行表达式
 * 支持:
 * - 变量: $state.count, $props.title
 * - 字面量: 123, "hello", true, false, null
 * - 比较运算: ===, !==, >, <, >=, <=
 * - 逻辑运算: &&, ||
 * - 算术运算: +, -, *, /
 * - 三元运算: condition ? trueVal : falseVal
 * - 属性访问: obj.property
 * - 数组访问: array[0]
 */
function evaluateExpressionInternal(
  expression: string,
  context: ExpressionContext,
): unknown {
  // 卫语句：处理无效输入
  if (!expression || typeof expression !== 'string') {
    return undefined
  }

  const trimmed = expression.trim()

  // 卫语句：空表达式
  if (trimmed === '') {
    return undefined
  }

  // 字面量处理
  const literalResult = parseLiteral(trimmed)
  if (literalResult !== undefined) {
    return literalResult
  }

  // 变量引用 ($state.xxx 或 $props.xxx)
  const variableResult = parseVariableReference(trimmed, context)
  if (variableResult !== undefined) {
    return variableResult
  }

  // 一元运算符: !a
  if (trimmed.startsWith('!')) {
    const val = evaluateExpressionInternal(trimmed.slice(1), context)
    return !val
  }

  // 三元表达式: a ? b : c
  // 注意：各部分可能包含运算符（如 $state.count > 5 ? "yes" : "no"）
  // 先尝试用 ? : 分割，然后递归解析各部分
  if (trimmed.includes('?') && trimmed.includes(':')) {
    // 找到第一个 ? 和对应的 :
    const questionIdx = trimmed.indexOf('?')
    let colonIdx = -1
    let depth = 0
    
    // 寻找匹配的 :（考虑嵌套）
    for (let i = questionIdx + 1; i < trimmed.length; i++) {
      const char = trimmed[i]
      if (char === '?') depth++
      else if (char === ':') depth--
      
      if (depth === -1) {
        colonIdx = i
        break
      }
    }
    
    if (colonIdx > 0) {
      const condExpr = trimmed.slice(0, questionIdx).trim()
      const trueExpr = trimmed.slice(questionIdx + 1, colonIdx).trim()
      const falseExpr = trimmed.slice(colonIdx + 1).trim()
      
      const condValue = evaluateExpressionInternal(condExpr, context)
      return condValue ?
        evaluateExpressionInternal(trueExpr, context) :
        evaluateExpressionInternal(falseExpr, context)
    }
  }
  
  // 比较运算: a === b, a > b, etc.
  const compareMatch = trimmed.match(/^(\S+)\s*(===|!==|>|<|>=|<=)\s*(\S+)$/)
  if (compareMatch) {
    const [, left, op, right] = compareMatch
    const leftVal = evaluateExpressionInternal(left, context)
    const rightVal = evaluateExpressionInternal(right, context)

    // 类型断言：确保是可比较的值
    if (typeof leftVal === 'number' && typeof rightVal === 'number') {
      switch (op) {
        case '===': return leftVal === rightVal
        case '!==': return leftVal !== rightVal
        case '>': return leftVal > rightVal
        case '<': return leftVal < rightVal
        case '>=': return leftVal >= rightVal
        case '<=': return leftVal <= rightVal
      }
    } else if (typeof leftVal === 'string' && typeof rightVal === 'string') {
      // 字符串比较
      switch (op) {
        case '===': return leftVal === rightVal
        case '!==': return leftVal !== rightVal
        case '>': return leftVal > rightVal
        case '<': return leftVal < rightVal
        case '>=': return leftVal >= rightVal
        case '<=': return leftVal <= rightVal
      }
    }

    return undefined
  }
  
  // 逻辑运算: a && b, a || b
  // 注意：右侧表达式可能包含运算符（如 $state.count > 5）
  // 使用非贪婪匹配直到遇到 && 或 ||
  const logicMatch = trimmed.match(/^(\S+)\s*(&&|\|\|)(.*)$/)
  if (logicMatch) {
    const [, left, op, right] = logicMatch
    const leftVal = evaluateExpressionInternal(left.trim(), context)
    const rightVal = evaluateExpressionInternal(right.trim(), context)

    if (op === '&&') {
      return Boolean(leftVal && rightVal)
    }
    if (op === '||') {
      return Boolean(leftVal || rightVal)
    }
  }
  
  // 算术运算: a + b, a - b, etc.
  const arithmeticMatch = trimmed.match(/^(\S+)\s*([+\-*/])\s*(\S+)$/)
  if (arithmeticMatch) {
    const [, left, op, right] = arithmeticMatch
    const leftVal = evaluateExpressionInternal(left, context)
    const rightVal = evaluateExpressionInternal(right, context)

    // 支持数字和字符串的加法（字符串连接）
    if (typeof leftVal === 'number' && typeof rightVal === 'number') {
      switch (op) {
        case '+': return leftVal + rightVal
        case '-': return leftVal - rightVal
        case '*': return leftVal * rightVal
        case '/': return leftVal / rightVal
      }
    } else if (typeof leftVal === 'string' && typeof rightVal === 'string') {
      // 字符串连接
      switch (op) {
        case '+': return leftVal + rightVal
      }
    }
    return undefined
  }
  
  // 属性访问: obj.property
  const propMatch = trimmed.match(/^(\S+)\.([a-zA-Z_$][a-zA-Z0-9_$]*)$/)
  if (propMatch) {
    const [, objExpr, prop] = propMatch
    const obj = evaluateExpressionInternal(objExpr, context)
    return safeGetProp(obj, prop)
  }
  
  // 数组访问: array[0]
  const arrayMatch = trimmed.match(/^(\S+)\[(\d+)\]$/)
  if (arrayMatch) {
    const [, arrExpr, index] = arrayMatch
    const arr = evaluateExpressionInternal(arrExpr, context)
    if (Array.isArray(arr)) {
      return arr[parseInt(index, 10)]
    }
    return undefined
  }
  
  // 属性访问 (带长度): array.length
  if (trimmed.endsWith('.length')) {
    const arrExpr = trimmed.slice(0, -7)
    const arr = evaluateExpressionInternal(arrExpr, context)
    if (Array.isArray(arr)) {
      return arr.length
    }
    return undefined
  }
  
  // 其他情况返回 undefined
  return undefined
}

/**
 * 验证表达式是否安全
 */
export function isValidExpression(expression: string): boolean {
  if (!expression || typeof expression !== 'string') {
    return false
  }
  
  const trimmed = expression.trim()
  
  if (trimmed === '') {
    return false
  }
  
  // 禁止危险函数调用
  const dangerousPatterns = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /constructor/i,
    /__proto__/i,
    /prototype/i,
    /document/i,
    /window/i,
    /parent/i,
    /top/i,
    /location/i,
    /alert\s*\(/i,
    /console\.(log|error|warn)/i,
    /require\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return false
    }
  }
  
  return true
}

/**
 * 清理表达式中的危险字符
 */
export function sanitizeExpression(expression: string): string {
  if (!expression || typeof expression !== 'string') {
    return ''
  }
  
  return expression
    .replace(/;/g, '')
    .replace(/alert\s*\(/gi, 'alert_blocked(')
    .replace(/eval\s*\(/gi, 'eval_blocked(')
    .replace(/console\.(log|error|warn)/gi, 'console_blocked.$1')
}

/**
 * 求值表达式
 * @param expression 表达式字符串
 * @param context 上下文对象
 * @returns 表达式结果
 */
export function evaluateExpression(
  expression: string | undefined | null,
  context: ExpressionContext = {},
): unknown {
  // 输入验证
  if (!expression || typeof expression !== 'string') {
    return undefined
  }
  
  // 安全检查
  if (!isValidExpression(expression)) {
    console.warn(`[Expression Engine] 安全检查失败: ${expression}`)
    return undefined
  }
  
  try {
    return evaluateExpressionInternal(expression, context)
  } catch (error) {
    console.warn(`[Expression Engine] 表达式执行错误: ${expression}`, error)
    return undefined
  }
}

/**
 * 执行带上下文的表达式
 * @param expression 表达式
 * @param context 包含 state, props, event, api 的上下文
 * @returns 执行结果
 */
export function executeExpression(
  expression: string,
  context: ExpressionContext,
): unknown {
  return evaluateExpression(expression, context)
}

/**
 * 检查条件是否满足
 * @param condition 条件（布尔值或表达式字符串）
 * @param context 上下文
 * @returns 是否满足条件
 */
export function checkCondition(
  condition: boolean | string | undefined,
  context: ExpressionContext,
): boolean {
  if (typeof condition === 'boolean') {
    return condition
  }
  
  if (typeof condition === 'string') {
    const result = evaluateExpression(condition, context)
    return Boolean(result)
  }
  
  return false
}
