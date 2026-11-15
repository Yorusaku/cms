import { describe, expect, it } from 'vitest'
import {
  findMissingBaseFields,
  isBaseFieldKey,
  isPhoneFieldKey,
  readTicketExceptionFormConfig,
  validateBusinessFormFields,
  validateTicketExceptionFormConfig,
  validateTicketFormValues,
  type BusinessFormFieldInput
} from '@cms/types'

/**
 * 业务表单字段校验（CMS 编辑器与后端共用同一实现）。
 * 这些规则决定「能不能写回 Schema」以及「能不能提交审核」，因此单独覆盖。
 */
const baseFields = (): BusinessFormFieldInput[] => [
  { key: 'name', label: '姓名', type: 'text', required: true },
  { key: 'phone', label: '联系电话', type: 'text', required: true }
]

describe('validateBusinessFormFields', () => {
  it('姓名 + 手机号基础字段即通过', () => {
    expect(validateBusinessFormFields(baseFields())).toEqual([])
  })

  it('基础字段可以改显示名称，不影响校验', () => {
    const fields = baseFields()
    fields[0].label = '您的姓名'
    fields[1].label = '手机号码'
    expect(validateBusinessFormFields(fields)).toEqual([])
  })

  it('兼容历史 phoneNumber 作为手机号字段', () => {
    const fields = baseFields()
    fields[1] = { key: 'phoneNumber', label: '手机', type: 'text', required: true }
    expect(validateBusinessFormFields(fields)).toEqual([])
    expect(isPhoneFieldKey('phoneNumber')).toBe(true)
  })

  it('缺少姓名或手机号时给出明确提示', () => {
    expect(validateBusinessFormFields([])).toEqual(['表单至少需要一个字段'])

    const onlyName = validateBusinessFormFields([baseFields()[0]])
    expect(onlyName.some(item => item.includes('手机号'))).toBe(true)

    const onlyPhone = validateBusinessFormFields([baseFields()[1]])
    expect(onlyPhone.some(item => item.includes('姓名'))).toBe(true)
  })

  it('key 为空或重复会被拦截', () => {
    const fields: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: '', label: '办理日期', type: 'date' }
    ]
    expect(validateBusinessFormFields(fields).some(item => item.includes('key 不能为空'))).toBe(
      true
    )

    const duplicated: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'phone', label: '备用电话', type: 'text' }
    ]
    expect(validateBusinessFormFields(duplicated).some(item => item.includes('重复'))).toBe(true)
  })

  it('名称不能为空，扩展字段之间不能重名', () => {
    const emptyLabel: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'visitDate', label: '  ', type: 'date' }
    ]
    expect(validateBusinessFormFields(emptyLabel).some(item => item.includes('名称不能为空'))).toBe(
      true
    )

    const duplicated: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'visitDate', label: '办理日期', type: 'date' },
      { key: 'visitDate2', label: '办理日期', type: 'text' }
    ]
    expect(
      validateBusinessFormFields(duplicated).some(item => item.includes('扩展字段名称重复'))
    ).toBe(true)
  })

  it('下拉字段至少一个非空选项且不重复', () => {
    const noOption: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'type', label: '业务类型', type: 'select', options: [] }
    ]
    expect(
      validateBusinessFormFields(noOption).some(item => item.includes('下拉选项至少需要一个'))
    ).toBe(true)

    const blankOption: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'type', label: '业务类型', type: 'select', options: ['', '  '] }
    ]
    expect(
      validateBusinessFormFields(blankOption).some(item => item.includes('下拉选项至少需要一个'))
    ).toBe(true)

    const duplicated: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'type', label: '业务类型', type: 'select', options: ['咨询', '咨询'] }
    ]
    expect(
      validateBusinessFormFields(duplicated).some(item => item.includes('下拉选项存在重复项'))
    ).toBe(true)

    const valid: BusinessFormFieldInput[] = [
      ...baseFields(),
      { key: 'type', label: '业务类型', type: 'select', options: ['咨询', '办理'] }
    ]
    expect(validateBusinessFormFields(valid)).toEqual([])
  })

  it('识别基础字段 key', () => {
    expect(isBaseFieldKey('name')).toBe(true)
    expect(isBaseFieldKey('phone')).toBe(true)
    expect(isBaseFieldKey('phoneNumber')).toBe(true)
    expect(isBaseFieldKey('visitDate')).toBe(false)
  })

  it('findMissingBaseFields 返回缺失项，不把 phoneNumber 当缺失', () => {
    expect(findMissingBaseFields([]).map(item => item.key)).toEqual(['name', 'phone'])
    expect(
      findMissingBaseFields([{ key: 'phoneNumber', label: '手机', type: 'text' }]).map(
        item => item.key
      )
    ).toEqual(['name'])
    expect(findMissingBaseFields(baseFields())).toEqual([])
  })

  it('requireBaseFields=false 时不要求姓名与手机号（票据异常表单）', () => {
    const fields: BusinessFormFieldInput[] = [
      { key: 'amount', label: '金额', type: 'text', required: true },
      { key: 'channel', label: '渠道', type: 'select', options: ['线上'] }
    ]

    // 默认仍要求基础字段
    expect(validateBusinessFormFields(fields).some(item => item.includes('姓名'))).toBe(true)

    // 票据异常表单不套用该限制
    expect(validateBusinessFormFields(fields, { requireBaseFields: false })).toEqual([])
  })

  it('requireBaseFields=false 仍然校验 key、名称与下拉选项', () => {
    const fields: BusinessFormFieldInput[] = [
      { key: '', label: '金额', type: 'text' },
      { key: 'channel', label: '渠道', type: 'select', options: [] }
    ]

    const issues = validateBusinessFormFields(fields, {
      requireBaseFields: false
    })
    expect(issues.some(item => item.includes('key 不能为空'))).toBe(true)
    expect(issues.some(item => item.includes('下拉选项至少需要一个'))).toBe(true)
    // 不应出现基础字段相关提示
    expect(issues.some(item => item.includes('姓名'))).toBe(false)
    expect(issues.some(item => item.includes('手机号'))).toBe(false)
  })
})

describe('票据异常表单配置与取值校验', () => {
  const baseProps = {
    businessCategory: '报销票据',
    allowedExceptionTypes: '票据信息缺失\n质检信息不一致',
    extraFields: [
      { key: 'issuedAt', label: '开票日期', type: 'date', required: true },
      {
        key: 'invoiceType',
        label: '票据类型',
        type: 'select',
        required: true,
        options: ['电子发票', '增值税专用发票']
      }
    ]
  }

  it('字符串形态的异常类型可读取并允许空扩展字段', () => {
    const config = readTicketExceptionFormConfig({
      ...baseProps,
      extraFields: []
    })
    expect(config.allowedExceptionTypes).toEqual(['票据信息缺失', '质检信息不一致'])
    // 没有扩展字段也应通过：票据异常允许只登记固定字段
    expect(validateTicketExceptionFormConfig(config)).toEqual([])
  })

  it('扩展字段不得占用固定字段 key，且 key / 名称不能重复', () => {
    const conflict = readTicketExceptionFormConfig({
      ...baseProps,
      extraFields: [
        { key: 'ticketNo', label: '票据号', type: 'text' },
        { key: 'dup', label: '甲', type: 'text' },
        { key: 'dup', label: '乙', type: 'text' }
      ]
    })
    const issues = validateTicketExceptionFormConfig(conflict)
    expect(issues.some(item => item.includes('固定字段'))).toBe(true)
    expect(issues.some(item => item.includes('重复'))).toBe(true)
  })

  it('非法类型与缺选项的下拉被拒绝', () => {
    const config = readTicketExceptionFormConfig({
      ...baseProps,
      extraFields: [
        { key: 'bad', label: '坏类型', type: 'number' },
        { key: 'empty', label: '空下拉', type: 'select', options: [] }
      ]
    })
    const issues = validateTicketExceptionFormConfig(config)
    expect(issues.some(item => item.includes('类型必须'))).toBe(true)
    expect(issues.some(item => item.includes('下拉选项至少需要一个'))).toBe(true)
  })

  it('提交值校验：未知 key、必填、下拉范围与日期格式', () => {
    const config = readTicketExceptionFormConfig(baseProps)

    expect(
      validateTicketFormValues(config, { unknown: 'x' }).some(item => item.includes('未定义的字段'))
    ).toBe(true)
    expect(validateTicketFormValues(config, {}).some(item => item.includes('开票日期'))).toBe(true)
    expect(
      validateTicketFormValues(config, {
        issuedAt: '2026-10-01',
        invoiceType: '其他'
      }).some(item => item.includes('可选范围'))
    ).toBe(true)
    expect(
      validateTicketFormValues(config, {
        issuedAt: '2026/10/01',
        invoiceType: '电子发票'
      }).some(item => item.includes('YYYY-MM-DD'))
    ).toBe(true)
    expect(
      validateTicketFormValues(config, {
        issuedAt: '2026-10-01',
        invoiceType: '电子发票'
      })
    ).toEqual([])
  })

  it('补充只校验本次字段，空值视为未提供', () => {
    const config = readTicketExceptionFormConfig(baseProps)
    expect(validateTicketFormValues(config, { issuedAt: '  ' }, { partial: true })).toEqual([])
  })
})
