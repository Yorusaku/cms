import { describe, expect, it } from 'vitest'
import { resolveMaterialDefinition } from '../index'

/**
 * BusinessForm 字段归一化。
 *
 * 关键契约：
 * - fieldsJson 优先于 fields（历史约定）；
 * - fieldsJson 非法时保留原文（交给编辑器提示），不能静默替换成默认字段；
 * - 只有 fields 的历史页面继续可读；
 * - 归一化后 fields 与 fieldsJson 保持一致（双写）。
 */
const normalize = (props: Record<string, unknown>) => {
  const definition = resolveMaterialDefinition('BusinessForm')
  expect(definition?.normalizeProps).toBeTruthy()
  return definition!.normalizeProps!(props) as Record<string, unknown>
}

const parse = (value: unknown) => JSON.parse(String(value)) as Array<Record<string, unknown>>

describe('BusinessForm 字段归一化', () => {
  it('fieldsJson 优先于 fields，并同步两者', () => {
    const result = normalize({
      fields: [{ key: 'name', label: '旧姓名', type: 'text', required: true }],
      fieldsJson: JSON.stringify([
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'phone', label: '联系电话', type: 'text', required: true },
        { key: 'visitDate', label: '办理日期', type: 'date' }
      ])
    })

    const fields = result.fields as Array<Record<string, unknown>>
    expect(fields).toHaveLength(3)
    expect(fields[2]).toMatchObject({ key: 'visitDate', label: '办理日期', type: 'date' })
    expect(parse(result.fieldsJson)).toEqual(fields)
  })

  it('fieldsJson 非法时保留原文，字段回落到 fields', () => {
    const brokenJson = '[{"key":"name","label":"姓名",]'
    const result = normalize({
      fieldsJson: brokenJson,
      fields: [
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'phone', label: '联系电话', type: 'text', required: true },
        { key: 'biz', label: '业务', type: 'text' }
      ]
    })

    // 原文未被覆盖，编辑器才能提示「JSON 无法解析」
    expect(result.fieldsJson).toBe(brokenJson)
    const fields = result.fields as Array<Record<string, unknown>>
    expect(fields.map(field => field.key)).toEqual(['name', 'phone', 'biz'])
  })

  it('历史页面只有 fields 时正常读取并补齐 fieldsJson', () => {
    const result = normalize({
      fields: [
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'phoneNumber', label: '手机', type: 'text', required: true }
      ]
    })

    const fields = result.fields as Array<Record<string, unknown>>
    expect(fields.map(field => field.key)).toEqual(['name', 'phoneNumber'])
    expect(parse(result.fieldsJson)).toEqual(fields)
  })

  it('都没有时回落到默认基础字段', () => {
    const result = normalize({})
    const fields = result.fields as Array<Record<string, unknown>>
    expect(fields.map(field => field.key)).toEqual(['name', 'phone'])
    expect(fields.every(field => field.required === true)).toBe(true)
  })

  it('下拉选项保持数组，其他类型也带空数组', () => {
    const result = normalize({
      fieldsJson: JSON.stringify([
        { key: 'name', label: '姓名', type: 'text', required: true },
        { key: 'phone', label: '联系电话', type: 'text', required: true },
        { key: 'biz', label: '业务', type: 'select', options: ['咨询', '办理'] }
      ])
    })

    const fields = result.fields as Array<Record<string, unknown>>
    expect(fields[2].options).toEqual(['咨询', '办理'])
    expect(fields[0].options).toEqual([])
  })
})
