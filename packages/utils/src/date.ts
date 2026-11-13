/**
 * 日期格式化选项
 */
export interface DateFormatOptions {
  format?: string
}

const REGEX = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/

/**
 * 格式化日期
 * @param val - 日期值，可以是字符串、数字或 Date 对象
 * @param options - 格式化选项
 * @param options.format - 格式字符串，默认 'yyyy.MM.dd'
 * @returns 格式化后的日期字符串，如果输入无效则返回 '--'
 *
 * @example
 * dateFormat('2024-01-15T10:30:00') // '2024.01.15'
 * dateFormat('2024-01-15T10:30:00', { format: 'yyyy-MM-dd hh:mm:ss' }) // '2024-01-15 10:30:00'
 */
export function dateFormat(val: string | number | Date, options: DateFormatOptions = {}): string {
  const { format = 'yyyy.MM.dd' } = options

  if (!val) {
    return '--'
  }

  let dateValue = val

  // 处理 Safari 浏览器的日期兼容性问题
  if (typeof val === 'string' && val.indexOf('-') > 0) {
    dateValue = val
      .replace(/T/g, ' ')
      .replace(/\.[\d]{3}Z/, '')
      .replace(/-/g, '/')

    if (val.indexOf('.') >= 0) {
      dateValue = val.slice(0, val.indexOf('.'))
    }
  }

  const date = new Date(dateValue)
  date.setHours(date.getHours() + 8)

  const match = date.toISOString().match(REGEX)
  if (!match) {
    return '--'
  }

  const [, yy, MM, dd, hh, mm, ss] = match

  return format
    .replace('yyyy', yy)
    .replace('yy', yy.slice(2))
    .replace('MM', MM)
    .replace('dd', dd)
    .replace('hh', hh)
    .replace('mm', mm)
    .replace('ss', ss)
}
