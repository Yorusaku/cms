/**
 * 判断值是否为空
 * @param val - 要检查的值
 * @returns 如果值为空字符串、undefined 或 null 则返回 true，否则返回 false
 */
export const isEmpty = (val: unknown): boolean => {
  return val === '' || val === undefined || val === null
}

/**
 * 深拷贝函数
 * @param obj - 要拷贝的对象
 * @returns 拷贝后的新对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as T
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 生成随机唯一 ID
 * @returns 随机生成的唯一标识符字符串
 */
export function createRandomId(): string {
  return Number(Math.random().toString().substr(3, 5) + Date.now()).toString(36)
}

/**
 * 防抖函数 - 在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时
 * @param func - 需要防抖的函数
 * @param wait - 等待时间（毫秒），默认 500ms
 * @param immediate - 是否立即执行，默认 false
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait = 500,
  immediate = false
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this
    if (immediate) {
      func.apply(context, args)
      immediate = false
      return
    }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(context, args)
    }, wait)
  }
}

/**
 * 节流函数 - 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效
 * @param func - 需要节流的函数
 * @param wait - 等待时间（毫秒），默认 500ms
 * @param immediate - 是否立即执行，默认 false
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait = 500,
  immediate = false
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return function (this: unknown, ...args: Parameters<T>) {
    const context = this
    if (immediate) {
      func.apply(context, args)
      immediate = false
      return
    }
    if (timer) return
    timer = setTimeout(() => {
      func.apply(context, args)
      timer = null
    }, wait)
  }
}
