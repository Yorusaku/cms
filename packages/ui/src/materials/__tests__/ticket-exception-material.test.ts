import { describe, expect, it } from 'vitest'
import { getMaterialAsyncComponent, getMaterialDefaults, resolveMaterialDefinition } from '../index'

/**
 * 票据异常登记物料。
 *
 * 与 BusinessForm 的区别：
 * - 固定业务字段是票据编号 / 异常类型 / 问题说明，不绑定线索接口；
 * - 不要求姓名与手机号基础字段；
 * - 扩展字段按稳定 key 存储，显示名可改。
 */
const normalize = (props: Record<string, unknown>) => {
  const definition = resolveMaterialDefinition('TicketExceptionForm')
  expect(definition?.normalizeProps).toBeTruthy()
  return definition!.normalizeProps!(props) as Record<string, unknown>
}

describe('TicketExceptionForm 物料', () => {
  it('已注册且可解析到运行时组件', () => {
    const definition = resolveMaterialDefinition('TicketExceptionForm')
    expect(definition).toBeTruthy()
    expect(definition!.label).toBe('票据异常登记')
    expect(getMaterialAsyncComponent('TicketExceptionForm')).toBeTruthy()
  })

  it('默认配置包含业务类别与两类异常', () => {
    const defaults = getMaterialDefaults('TicketExceptionForm') as Record<string, unknown>
    expect(defaults.businessCategory).toBe('报销票据')
    expect(String(defaults.allowedExceptionTypes)).toContain('票据信息缺失')
    expect(String(defaults.allowedExceptionTypes)).toContain('质检信息不一致')
  })

  it('异常类型支持字符串与数组两种历史形态', () => {
    const fromText = normalize({
      allowedExceptionTypes: '票据信息缺失\n质检信息不一致'
    })
    expect(fromText.allowedExceptionTypes).toBe('票据信息缺失\n质检信息不一致')

    const fromArray = normalize({
      allowedExceptionTypes: ['票据信息缺失', '质检信息不一致']
    })
    expect(fromArray.allowedExceptionTypes).toBe('票据信息缺失\n质检信息不一致')
  })

  it('扩展字段被规范化，缺 key 或名称的条目被丢弃', () => {
    const result = normalize({
      extraFields: [
        { key: 'amount', label: '金额', type: 'text', required: true },
        { key: 'channel', label: '渠道', type: 'select', options: ['线上'] },
        { key: '', label: '无 key' },
        { key: 'noLabel', label: '' }
      ]
    })

    const extra = result.extraFields as Array<Record<string, unknown>>
    expect(extra).toHaveLength(2)
    expect(extra[0]).toMatchObject({ key: 'amount', required: true })
    expect(extra[1].options).toEqual(['线上'])
  })

  it('扩展字段支持 JSON 字符串形态（历史数据）', () => {
    const result = normalize({
      extraFields: JSON.stringify([{ key: 'amount', label: '金额', type: 'text' }])
    })
    const extra = result.extraFields as Array<Record<string, unknown>>
    expect(extra).toHaveLength(1)
    expect(extra[0].key).toBe('amount')
  })

  it('缺失配置时回落到默认值与空数组', () => {
    const result = normalize({})
    expect(result.title).toBe('票据异常登记')
    expect(result.businessCategory).toBe('报销票据')
    expect(result.extraFields).toEqual([])
  })
})
