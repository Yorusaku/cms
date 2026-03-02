import { describe, it, expect, vi, beforeEach } from 'vitest'
import { evaluateExpression, isValidExpression, sanitizeExpression } from '../src/expression'

// 模拟上下文
const createContext = (overrides?: Record<string, unknown>) => ({
  $state: {
    count: 10,
    name: '测试',
    visible: true,
    items: [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }],
    nested: { value: 42 },
  },
  $props: {
    title: 'Props标题',
    disabled: false,
  },
  $event: { type: 'click', target: null },
  ...overrides,
})

describe('表达式求值器', () => {
  describe('变量引用', () => {
    it('应该正确解析 $state 变量', () => {
      const context = createContext()
      const result = evaluateExpression('$state.count', context)
      expect(result).toBe(10)
    })

    it('应该正确解析 $props 变量', () => {
      const context = createContext()
      const result = evaluateExpression('$props.title', context)
      expect(result).toBe('Props标题')
    })

    it('应该正确解析嵌套属性', () => {
      const context = createContext()
      const result = evaluateExpression('$state.nested.value', context)
      expect(result).toBe(42)
    })

    it('应该处理不存在的属性返回 undefined', () => {
      const context = createContext()
      const result = evaluateExpression('$state.nonExistent', context)
      expect(result).toBeUndefined()
    })
  })

  describe('布尔运算', () => {
    it('应该正确计算比较运算符', () => {
      const context = createContext()
      expect(evaluateExpression('$state.count > 5', context)).toBe(true)
      expect(evaluateExpression('$state.count < 5', context)).toBe(false)
      expect(evaluateExpression('$state.count === 10', context)).toBe(true)
      expect(evaluateExpression('$state.count !== 10', context)).toBe(false)
    })

    it('应该正确计算逻辑运算符', () => {
      const context = createContext()
      expect(evaluateExpression('$state.visible && $state.count > 5', context)).toBe(true)
      expect(evaluateExpression('$state.visible && $state.count < 5', context)).toBe(false)
      expect(evaluateExpression('$state.visible || $state.count < 5', context)).toBe(true)
      expect(evaluateExpression('!$state.visible', context)).toBe(false)
    })
  })

  describe('字符串运算', () => {
    it('应该正确比较字符串', () => {
      const context = createContext()
      expect(evaluateExpression('$state.name === \"测试\"', context)).toBe(true)
      expect(evaluateExpression('$state.name === \"other\"', context)).toBe(false)
    })
  })

  describe('数组操作', () => {
    it('应该正确获取数组长度', () => {
      const context = createContext()
      const result = evaluateExpression('$state.items.length', context)
      expect(result).toBe(2)
    })

    it('应该正确访问数组元素', () => {
      const context = createContext()
      const result = evaluateExpression('$state.items[0].name', context)
      expect(result).toBe('item1')
    })

    it('应该处理数组越界返回 undefined', () => {
      const context = createContext()
      const result = evaluateExpression('$state.items[100]', context)
      expect(result).toBeUndefined()
    })
  })

  describe('条件表达式', () => {
    it('应该正确解析三元表达式', () => {
      const context = createContext()
      expect(evaluateExpression('$state.count > 5 ? \"yes\" : \"no\"', context)).toBe('yes')
      expect(evaluateExpression('$state.count < 5 ? \"yes\" : \"no\"', context)).toBe('no')
    })
  })

  describe('错误处理', () => {
    it('应该处理无效表达式返回 undefined', () => {
      const context = createContext()
      const result = evaluateExpression('invalid syntax @@#$', context)
      expect(result).toBeUndefined()
    })

    it('应该处理空表达式返回 undefined', () => {
      const context = createContext()
      const result = evaluateExpression('', context)
      expect(result).toBeUndefined()
    })

    it('应该处理 null 表达式返回 undefined', () => {
      const context = createContext()
      const result = evaluateExpression(null as unknown as string, context)
      expect(result).toBeUndefined()
    })
  })

  describe('安全防护', () => {
    it('应该阻止访问危险属性', () => {
      const context = createContext()
      // 尝试访问构造函数
      const result = evaluateExpression('constructor', context)
      expect(result).toBeUndefined()
    })

    it('应该阻止访问全局对象', () => {
      const context = createContext()
      // 尝试访问 window/document（在非浏览器环境）
      const result = evaluateExpression('window', context)
      expect(result).toBeUndefined()
    })
  })
})

describe('表达式验证器', () => {
  describe('isValidExpression', () => {
    it('应该验证合法表达式', () => {
      expect(isValidExpression('$state.count')).toBe(true)
      expect(isValidExpression('$props.title')).toBe(true)
      expect(isValidExpression('$state.count > 5')).toBe(true)
      expect(isValidExpression('\"hello\" + $state.name')).toBe(true)
    })

    it('应该拒绝非法表达式', () => {
      expect(isValidExpression('constructor')).toBe(false)
      expect(isValidExpression('__proto__')).toBe(false)
      expect(isValidExpression('alert(1)')).toBe(false)
      expect(isValidExpression('eval(\"1+1\")')).toBe(false)
      expect(isValidExpression('require(\"fs\")')).toBe(false)
    })
  })

})

describe('表达式执行器错误处理', () => {
  it('应该在上下文缺失时返回 undefined', () => {
    const result = evaluateExpression('$state.count', {})
    expect(result).toBeUndefined()
  })

  it('应该在表达式为空时返回 undefined', () => {
    const context = createContext()
    const result = evaluateExpression(undefined as unknown as string, context)
    expect(result).toBeUndefined()
  })
})
