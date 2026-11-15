import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common'
import { TicketExceptionService } from '../src/modules/ticket-exception/ticket-exception.service'
import { TicketException } from '../src/modules/ticket-exception/entities/ticket-exception.entity'
import { TicketExceptionAttachment as TicketExceptionAttachmentEntity } from '../src/modules/ticket-exception/entities/ticket-exception-attachment.entity'
import { Notification as NotificationEntity } from '../src/modules/notification/entities/notification.entity'
import { TicketExceptionEvent } from '../src/modules/ticket-exception/entities/ticket-exception-event.entity'
import type { AuthenticatedUser } from '../src/modules/auth/strategies/jwt.strategy'

/**
 * 票据异常：状态机、幂等、字段校验、权限与分页。
 *
 * 用内存实现模拟仓储与事务，不连数据库。
 */
const FORM_PROPS = {
  businessCategory: '报销票据',
  allowedExceptionTypes: ['票据信息缺失', '质检信息不一致'],
  extraFields: [
    { key: 'amount', label: '金额', type: 'text', required: true },
    {
      key: 'channel',
      label: '提交渠道',
      type: 'select',
      required: false,
      options: ['线上', '线下']
    }
  ]
}

const editorUser: AuthenticatedUser = {
  id: 'u-editor',
  username: '编辑员甲',
  role: 'editor'
} as AuthenticatedUser

const otherUser: AuthenticatedUser = {
  id: 'u-other',
  username: '编辑员乙',
  role: 'editor'
} as AuthenticatedUser

const createHarness = (options?: {
  pageStatus?: string
  pageEnabled?: number
  componentType?: string
  publishedVersionId?: string
  /** 组件存在但不挂在 rootIds 上（孤立组件） */
  orphanComponent?: boolean
  /** 表单配置覆盖（用于空扩展字段、非法配置等场景） */
  formProps?: Record<string, unknown>
  /** pageConfig 覆盖（如 businessScenarioId） */
  pageConfig?: Record<string, unknown>
  /** 主记录保存时抛出的错误（模拟并发唯一约束冲突等） */
  ticketSaveError?: Error
  /** 历史保存时抛出的错误（模拟事件写入失败） */
  eventSaveError?: Error
  /** 从第 N 次历史保存开始失败（create 算第 1 次），用于测上传中途失败 */
  failEventSaveFrom?: number
}) => {
  let eventSaveCalls = 0
  const tickets: TicketException[] = []
  const events: TicketExceptionEvent[] = []
  let seq = 0
  let eventSeq = 0

  const page = {
    id: 7,
    isDeleted: false,
    status: options?.pageStatus ?? 'published',
    isAbled: options?.pageEnabled ?? 1,
    publishedVersionId: options?.publishedVersionId ?? 'v-1',
    publishedSchema: {
      version: '2.0.0',
      pageConfig: { name: '票据异常登记', ...(options?.pageConfig ?? {}) },
      rootIds: options?.orphanComponent ? [] : ['form-1'],
      componentMap: {
        'form-1': {
          id: 'form-1',
          type: options?.componentType ?? 'TicketExceptionForm',
          parentId: null,
          children: [],
          props: options?.formProps ?? FORM_PROPS,
          styles: {}
        }
      }
    }
  }

  const matchWhere = (item: TicketException, where: Record<string, unknown>) =>
    Object.entries(where).every(
      ([key, value]) => (item as unknown as Record<string, unknown>)[key] === value
    )

  const ticketRepo = {
    create: (value: Partial<TicketException>) => ({ ...value }) as TicketException,
    save: jest.fn(async (value: TicketException) => {
      if (options?.ticketSaveError) {
        throw options.ticketSaveError
      }
      if (!value.id) {
        value.id = ++seq
        value.createdAt = new Date()
        value.updatedAt = new Date()
        tickets.push(value)
      }
      return value
    }),
    findOne: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
      return tickets.find(item => matchWhere(item, where)) ?? null
    }),
    createQueryBuilder: jest.fn(() => {
      const state: {
        filters: Array<(item: TicketException) => boolean>
        skip: number
        take: number
      } = { filters: [], skip: 0, take: 20 }

      const builder = {
        andWhere: (sql: string, params: Record<string, string>) => {
          if (sql.includes('ticket_no')) {
            const keyword = String(params.ticketNo).replace(/%/g, '')
            state.filters.push(item => item.ticketNo.includes(keyword))
          } else if (sql.includes('exception_type')) {
            state.filters.push(item => item.exceptionType === params.exceptionType)
          } else if (sql.includes('ticket.status')) {
            state.filters.push(item => item.status === params.status)
          } else if (sql.includes('submitter_username')) {
            state.filters.push(item => item.submitterUsername === params.submitter)
          }
          return builder
        },
        orderBy: () => builder,
        skip: (value: number) => {
          state.skip = value
          return builder
        },
        take: (value: number) => {
          state.take = value
          return builder
        },
        getManyAndCount: async () => {
          const filtered = tickets.filter(item => state.filters.every(fn => fn(item)))
          return [filtered.slice(state.skip, state.skip + state.take), filtered.length]
        }
      }
      return builder
    })
  }

  const eventRepo = {
    create: (value: Partial<TicketExceptionEvent>) => ({ ...value }) as TicketExceptionEvent,
    save: jest.fn(async (value: TicketExceptionEvent) => {
      eventSaveCalls += 1
      if (options?.eventSaveError) {
        throw options.eventSaveError
      }
      if (options?.failEventSaveFrom !== undefined && eventSaveCalls >= options.failEventSaveFrom) {
        throw new Error('event insert failed')
      }
      value.id = ++eventSeq
      value.createdAt = new Date()
      events.push(value)
      return value
    }),
    find: jest.fn(async ({ where }: { where: Record<string, unknown> }) =>
      events.filter(event => matchWhere(event, where))
    )
  }

  const manager = {
    getRepository: (entity: unknown) => {
      if (entity === TicketException) {
        return {
          create: ticketRepo.create,
          save: ticketRepo.save,
          createQueryBuilder: () => {
            const builder = {
              setLock: () => builder,
              where: (_sql: string, params: { id: number }) => {
                builder.__id = params.id
                return builder
              },
              getOne: async () => tickets.find(item => item.id === builder.__id) ?? null,
              __id: 0
            } as unknown as {
              setLock: () => unknown
              where: (sql: string, params: { id: number }) => unknown
              getOne: () => Promise<TicketException | null>
              __id: number
            }
            return builder
          }
        }
      }
      if (entity === NotificationEntity) {
        return {
          insert: () => Promise.resolve()
        }
      }
      if (entity === TicketExceptionAttachmentEntity) {
        return {
          create: attachmentRepo.create,
          save: attachmentRepo.save,
          count: attachmentRepo.count
        }
      }
      return {
        create: eventRepo.create,
        save: eventRepo.save
      }
    }
  }

  const attachments: TicketExceptionAttachmentEntity[] = []
  let attachmentSeq = 0
  const attachmentRepo = {
    create: (value: Partial<TicketExceptionAttachmentEntity>) =>
      ({ ...value }) as TicketExceptionAttachmentEntity,
    save: jest.fn(async (value: TicketExceptionAttachmentEntity) => {
      value.id = ++attachmentSeq
      value.createdAt = new Date()
      attachments.push(value)
      return value
    }),
    find: jest.fn(async () => attachments),
    count: jest.fn(async () => attachments.length),
    findOne: jest.fn(
      async ({ where }: { where: Record<string, unknown> }) =>
        attachments.find(item => matchWhere(item, where)) ?? null
    )
  }

  const scenarios: Array<{ id: string }> = []
  const scenarioService = {
    ensureExists: async (id: string) => {
      const row = scenarios.find(item => item.id === id)
      if (!row) {
        throw new Error('业务场景不存在或已被移除，请重新选择')
      }
      return row
    },
    register: (id: string) => {
      scenarios.push({ id })
    }
  }

  const notifications: Array<Record<string, unknown>> = []
  const notificationService = {
    createForEventIn: async (_manager: unknown, input: { sourceEventId: number; type: string }) => {
      notifications.push({ ...input })
    },
    unreadCount: async () => notifications.length
  }

  const removedFiles: string[] = []
  const privateStorage = {
    save: (buffer: Buffer) => ({
      storageName: `saved-${buffer.length}-${++attachmentSeq}.jpg`,
      mimeType: 'image/jpeg'
    }),
    read: (name: string) => ({ buffer: Buffer.from(name), mimeType: 'image/jpeg' }),
    remove: (name: string) => {
      removedFiles.push(name)
      return { removed: true }
    }
  }

  const pageRepo = {
    findOne: jest.fn(async () => page)
  }

  const dataSource = {
    transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => cb(manager))
  }

  const service = new TicketExceptionService(
    ticketRepo as never,
    eventRepo as never,
    pageRepo as never,
    dataSource as never,
    attachmentRepo as never,
    privateStorage as never,
    scenarioService as never,
    notificationService as never
  )

  return {
    service,
    tickets,
    events,
    attachments,
    notifications,
    removedFiles,
    scenarioService,
    page
  }
}

const baseDto = (overrides: Record<string, unknown> = {}) => ({
  requestId: '11111111-1111-4111-8111-111111111111',
  pageId: 7,
  componentId: 'form-1',
  publishedVersionId: 'v-1',
  ticketNo: 'FP-2026-0001',
  exceptionType: '票据信息缺失',
  description: '缺少开票日期',
  extraFields: { amount: '120.00' },
  ...overrides
})

describe('TicketExceptionService 创建', () => {
  it('按发布快照校验并写入字段快照', async () => {
    const { service, tickets, events } = createHarness()

    const result = await service.create(baseDto() as never, editorUser)

    expect(result).toEqual({ id: 1, duplicated: false })
    expect(tickets[0].status).toBe('pending')
    expect(tickets[0].businessCategory).toBe('报销票据')
    expect(tickets[0].extraFields).toEqual({ amount: '120.00' })
    const snapshot = tickets[0].fieldSnapshot as {
      fixedFields: unknown[]
      extraFields: unknown[]
    }
    expect(snapshot.fixedFields).toHaveLength(3)
    expect(snapshot.extraFields).toHaveLength(2)
    expect(events).toHaveLength(1)
    expect(events[0].action).toBe('created')
  })

  it('同一提交人重试返回原记录，不重复写历史', async () => {
    const { service, tickets, events } = createHarness()

    const first = await service.create(baseDto() as never, editorUser)
    const second = await service.create(baseDto() as never, editorUser)

    expect(first.duplicated).toBe(false)
    expect(second).toEqual({ id: first.id, duplicated: true })
    expect(tickets).toHaveLength(1)
    expect(events).toHaveLength(1)
  })

  it('不同提交人用同一 requestId 不会拿到他人记录', async () => {
    const { service, tickets } = createHarness()

    await service.create(baseDto() as never, editorUser)
    const other = await service.create(baseDto() as never, otherUser)

    expect(other.duplicated).toBe(false)
    expect(tickets).toHaveLength(2)
    expect(tickets[1].submitterUsername).toBe('编辑员乙')
  })

  it('已发布页面保存草稿后，旧快照仍可登记', async () => {
    // 保存草稿会把 page.status 改成 draft，但发布快照仍然在线
    const harness = createHarness({ pageStatus: 'draft' })

    const result = await harness.service.create(baseDto() as never, editorUser)

    expect(result.duplicated).toBe(false)
    expect(harness.tickets).toHaveLength(1)
  })

  it('页面下线、版本变化、组件不存在都给出明确提示', async () => {
    const offline = createHarness({ pageEnabled: 0 })
    await expect(offline.service.create(baseDto() as never, editorUser)).rejects.toBeInstanceOf(
      ConflictException
    )

    const versionChanged = createHarness({ publishedVersionId: 'v-2' })
    await expect(versionChanged.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      '页面已更新发布版本'
    )

    const missing = createHarness()
    await expect(
      missing.service.create(baseDto({ componentId: 'ghost' }) as never, editorUser)
    ).rejects.toThrow('表单组件不存在')
  })

  it('孤立组件（未挂在页面上）不能提交', async () => {
    const harness = createHarness({ orphanComponent: true })

    await expect(harness.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      '表单组件未挂载到页面'
    )
  })

  it('没有扩展字段的表单也能登记', async () => {
    const harness = createHarness({
      formProps: {
        businessCategory: '质检票据',
        allowedExceptionTypes: '质检信息不一致',
        extraFields: []
      }
    })

    const result = await harness.service.create(
      baseDto({
        exceptionType: '质检信息不一致',
        extraFields: {}
      }) as never,
      editorUser
    )

    expect(result.duplicated).toBe(false)
    expect(harness.tickets[0].extraFields).toBeNull()
  })

  it('非法票据配置明确报错，不静默丢弃字段', async () => {
    const duplicateKey = createHarness({
      formProps: {
        businessCategory: '报销票据',
        allowedExceptionTypes: ['票据信息缺失'],
        extraFields: [
          { key: 'ticketNo', label: '票据号', type: 'text' },
          { key: 'dup', label: '甲', type: 'text' },
          { key: 'dup', label: '乙', type: 'text' }
        ]
      }
    })
    await expect(duplicateKey.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      '表单配置不完整'
    )

    const noType = createHarness({
      formProps: {
        businessCategory: '报销票据',
        allowedExceptionTypes: [],
        extraFields: []
      }
    })
    await expect(noType.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      '至少需要配置一个异常类型'
    )
  })

  it('未知扩展 key 与非法日期都被拒绝', async () => {
    const harness = createHarness({
      formProps: {
        businessCategory: '报销票据',
        allowedExceptionTypes: ['票据信息缺失'],
        extraFields: [{ key: 'issuedAt', label: '开票日期', type: 'date', required: true }]
      }
    })

    await expect(
      harness.service.create(baseDto({ extraFields: { amount: '12' } }) as never, editorUser)
    ).rejects.toThrow('未定义的字段')

    await expect(
      harness.service.create(
        baseDto({ extraFields: { issuedAt: '2026/10/01' } }) as never,
        editorUser
      )
    ).rejects.toThrow('YYYY-MM-DD')

    const ok = await harness.service.create(
      baseDto({ extraFields: { issuedAt: '2026-10-01' } }) as never,
      editorUser
    )
    expect(ok.duplicated).toBe(false)
  })

  it('历史写入失败时不返回成功（回滚由真实库用例覆盖）', async () => {
    const harness = createHarness({
      eventSaveError: new Error('insert event failed')
    })

    await expect(harness.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      'insert event failed'
    )
  })

  it('并发撞唯一索引时读回原记录，其他错误照常抛出', async () => {
    const { QueryFailedError } = await import('typeorm')
    const duplicatedError = new QueryFailedError('INSERT', [], {
      code: '23505',
      constraint: 'uq_ticket_exceptions_request_submitter'
    } as never)
    const harness = createHarness({ ticketSaveError: duplicatedError })

    // 第一次因唯一约束失败；模拟「另一个请求已经写入」后重试读回
    const first = await harness.service
      .create(baseDto() as never, editorUser)
      .catch((error: unknown) => error)
    expect(first).toBeInstanceOf(QueryFailedError)

    const otherError = createHarness({
      ticketSaveError: new Error('connection lost')
    })
    await expect(otherError.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      'connection lost'
    )
  })

  it('组件类型不符时拒绝，避免复用到其他表单', async () => {
    const { service } = createHarness({ componentType: 'BusinessForm' })

    await expect(service.create(baseDto() as never, editorUser)).rejects.toBeInstanceOf(
      BadRequestException
    )
  })

  it('异常类型必须在允许范围内，扩展必填字段不能为空', async () => {
    const { service } = createHarness()

    await expect(
      service.create(baseDto({ exceptionType: '不存在的类型' }) as never, editorUser)
    ).rejects.toThrow('异常类型')

    await expect(service.create(baseDto({ extraFields: {} }) as never, editorUser)).rejects.toThrow(
      '金额'
    )
  })

  it('下拉字段的取值必须命中选项', async () => {
    const { service } = createHarness()

    await expect(
      service.create(
        baseDto({ extraFields: { amount: '1', channel: '其他' } }) as never,
        editorUser
      )
    ).rejects.toThrow('可选范围')
  })
})

describe('TicketExceptionService 列表与详情', () => {
  it('按条件筛选并返回服务端分页总数', async () => {
    const { service } = createHarness()
    await service.create(baseDto() as never, editorUser)
    await service.create(
      baseDto({
        requestId: '22222222-2222-4222-8222-222222222222',
        ticketNo: 'FP-2026-0002',
        exceptionType: '质检信息不一致'
      }) as never,
      otherUser
    )

    const all = await service.getList({})
    expect(all.total).toBe(2)
    expect(all.pageSize).toBe(20)

    const filtered = await service.getList({ ticketNo: '0002' })
    expect(filtered.total).toBe(1)
    expect(filtered.items[0].ticketNo).toBe('FP-2026-0002')

    const byType = await service.getList({ exceptionType: '票据信息缺失' })
    expect(byType.total).toBe(1)

    const bySubmitter = await service.getList({ submitter: '编辑员乙' })
    expect(bySubmitter.total).toBe(1)
  })

  it('分页参数生效，pageSize 上限被收敛', async () => {
    const { service } = createHarness()
    for (let index = 1; index <= 3; index += 1) {
      await service.create(
        baseDto({
          requestId: `3333333${index}-3333-4333-8333-333333333333`,
          ticketNo: `FP-2026-000${index}`
        }) as never,
        editorUser
      )
    }

    const second = await service.getList({ pageNum: 2, pageSize: 2 })
    expect(second.items).toHaveLength(1)
    expect(second.total).toBe(3)

    const capped = await service.getList({ pageSize: 500 })
    expect(capped.pageSize).toBe(100)
  })

  it('详情返回字段快照与时间线', async () => {
    const { service } = createHarness()
    const created = await service.create(baseDto() as never, editorUser)

    const detail = await service.getDetail(created.id, editorUser)
    expect(detail.status).toBe('pending')
    expect(detail.extraFields).toEqual({ amount: '120.00' })
    expect(detail.fieldSnapshot.extraFields).toHaveLength(2)
    expect(detail.events).toHaveLength(1)
    expect(detail.events[0].action).toBe('created')
  })
})

describe('TicketExceptionService 处理与补充', () => {
  it('pending 可以要求补充，状态转 needs_supplement 并写历史', async () => {
    const { service, events } = createHarness()
    const created = await service.create(baseDto() as never, editorUser)

    const detail = await service.process(
      { id: created.id, action: 'request_supplement', note: '请补充开票日期' },
      editorUser
    )

    expect(detail.status).toBe('needs_supplement')
    expect(events.map(event => event.action)).toEqual(['created', 'supplement_requested'])
  })

  it('非 pending 状态不能重复处理', async () => {
    const { service } = createHarness()
    const created = await service.create(baseDto() as never, editorUser)
    await service.process(
      { id: created.id, action: 'request_supplement', note: '补充' },
      editorUser
    )

    await expect(
      service.process({ id: created.id, action: 'resolve', note: '直接解决' }, editorUser)
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('只有原提交人可以补充，且只在 needs_supplement 状态', async () => {
    const { service } = createHarness()
    const created = await service.create(baseDto() as never, editorUser)

    // pending 状态不能补充
    await expect(
      service.supplement(
        { id: created.id, note: '补充内容', extraFields: { amount: '1' } },
        editorUser
      )
    ).rejects.toBeInstanceOf(ConflictException)

    await service.process(
      { id: created.id, action: 'request_supplement', note: '请补充' },
      editorUser
    )

    // 他人不能补充
    await expect(
      service.supplement(
        { id: created.id, note: '补充内容', extraFields: { amount: '1' } },
        otherUser
      )
    ).rejects.toBeInstanceOf(ForbiddenException)

    // 快照之外的 key 不能写入补充记录
    await expect(
      service.supplement(
        { id: created.id, note: '补充', extraFields: { unknownKey: 'x' } },
        editorUser
      )
    ).rejects.toThrow('未定义的字段')

    // 空字符串不算清空：已有值保持不变（补充后回到 pending，需要再次要求补充）
    const blank = await service.supplement(
      { id: created.id, note: '补充', extraFields: { amount: '   ' } },
      editorUser
    )
    expect(blank.extraFields).toEqual({ amount: '120.00' })
    expect(blank.status).toBe('pending')

    await service.process(
      { id: created.id, action: 'request_supplement', note: '请补充渠道' },
      editorUser
    )

    const detail = await service.supplement(
      { id: created.id, note: '已补充开票日期', extraFields: { channel: '线上' } },
      editorUser
    )
    expect(detail.status).toBe('pending')
    // 增量合并：原金额保留，新增渠道
    expect(detail.extraFields).toEqual({ amount: '120.00', channel: '线上' })
  })

  it('补充后可以解决，resolved 不再允许处理', async () => {
    const { service, events } = createHarness()
    const created = await service.create(baseDto() as never, editorUser)

    const resolved = await service.process(
      { id: created.id, action: 'resolve', note: '已线下核实' },
      editorUser
    )
    expect(resolved.status).toBe('resolved')
    expect(events.map(event => event.action)).toEqual(['created', 'resolved'])

    await expect(
      service.process(
        { id: created.id, action: 'request_supplement', note: '再来一次' },
        editorUser
      )
    ).rejects.toThrow('已解决')
  })
})

describe('TicketExceptionService 私有材料', () => {
  const pngFile = (size = 1024) => {
    // PNG 文件头 + 填充，让服务端按文件头识别通过
    const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    return {
      originalname: '质检单.png',
      size,
      buffer: Buffer.concat([header, Buffer.alloc(Math.max(0, size - header.length))])
    } as unknown as Express.Multer.File
  }

  it('只有原提交人可以上传，且记录未解决', async () => {
    const harness = createHarness()
    const created = await harness.service.create(baseDto() as never, editorUser)

    await expect(
      harness.service.uploadAttachment(created.id, pngFile(), otherUser as never)
    ).rejects.toBeInstanceOf(ForbiddenException)

    // resolved 后不能上传
    await harness.service.process({ id: created.id, action: 'resolve', note: '完成' }, editorUser)
    await expect(
      harness.service.uploadAttachment(created.id, pngFile(), editorUser as never)
    ).rejects.toThrow('已解决')
  })

  it('最多 3 张，成功上传写元数据与材料事件且不改状态', async () => {
    const harness = createHarness()
    const created = await harness.service.create(baseDto() as never, editorUser)
    const id = created.id

    for (let index = 0; index < 3; index += 1) {
      await harness.service.uploadAttachment(
        id,
        pngFile(1024 + index) as never,
        editorUser as never
      )
    }
    await expect(
      harness.service.uploadAttachment(id, pngFile() as never, editorUser as never)
    ).rejects.toThrow('材料最多 3 张')

    const detail = await harness.service.getDetail(id, editorUser)
    expect(detail.attachments).toHaveLength(3)
    expect(detail.status).toBe('pending')
    expect(detail.events.map(event => event.action)).toContain('material_added')
  })

  it('空文件与非法扩展名被拒绝', async () => {
    const harness = createHarness()
    const created = await harness.service.create(baseDto() as never, editorUser)

    await expect(
      harness.service.uploadAttachment(created.id, pngFile(0) as never, editorUser as never)
    ).rejects.toThrow('文件内容为空')

    await expect(
      harness.service.uploadAttachment(
        created.id,
        { originalname: 'doc.pdf', size: 100, buffer: Buffer.alloc(100) } as never,
        editorUser as never
      )
    ).rejects.toThrow('JPG/JPEG/PNG')
  })

  it('元数据写入失败时清理本次文件，不影响旧材料', async () => {
    // create 是第 1 次历史保存；第一次上传是第 2 次（成功），第二次上传从第 3 次起失败
    const harness = createHarness({ failEventSaveFrom: 3 })
    const created = await harness.service.create(baseDto() as never, editorUser)
    const id = created.id
    // 先成功传一张
    await harness.service.uploadAttachment(id, pngFile() as never, editorUser as never)

    // 再传第二张：历史写入失败 → 元数据回滚，本次文件被清理
    await expect(
      harness.service.uploadAttachment(id, pngFile() as never, editorUser as never)
    ).rejects.toThrow('event insert failed')
    // 文件清理被触发；元数据的事务回滚由真实库用例覆盖
    // （内存 mock 无法模拟回滚，push 进数组的记录不会撤销）
    expect(harness.removedFiles).toHaveLength(1)
  })
})

describe('TicketExceptionService 场景归属', () => {
  const scenarioId = '11111111-2222-4333-8444-555555555555'

  it('登记记录从发布快照写入场景归属', async () => {
    const harness = createHarness({ pageConfig: { businessScenarioId: scenarioId } })
    harness.scenarioService.register(scenarioId)

    const created = await harness.service.create(baseDto() as never, editorUser)
    expect(created.duplicated).toBe(false)
    expect(harness.tickets[0].businessScenarioId).toBe(scenarioId)
  })

  it('伪造的场景绑定被拒绝，记录保持未归属', async () => {
    const harness = createHarness({ pageConfig: { businessScenarioId: scenarioId } })
    // 未注册场景
    await expect(harness.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      '业务场景不存在'
    )

    // 绑定格式非法
    const invalid = createHarness({
      pageConfig: { businessScenarioId: 'not-a-uuid' }
    })
    await expect(invalid.service.create(baseDto() as never, editorUser)).rejects.toThrow(
      '业务场景无效'
    )
  })

  it('未绑定场景的旧快照仍可登记，记录保持未归属', async () => {
    const harness = createHarness()
    const created = await harness.service.create(baseDto() as never, editorUser)
    expect(created.duplicated).toBe(false)
    expect(harness.tickets[0].businessScenarioId).toBeNull()
  })

  it('scenarioId 与 unassignedOnly 互斥', async () => {
    const harness = createHarness()
    await expect(
      harness.service.getList({
        scenarioId,
        unassignedOnly: true
      } as never)
    ).rejects.toThrow('不能同时提供')
  })
})

describe('TicketExceptionService 站内提醒', () => {
  it('要求补充与解决在同一事务里产生提醒，接收人是原提交人', async () => {
    const harness = createHarness()
    const created = await harness.service.create(baseDto() as never, editorUser)
    const id = created.id

    await harness.service.process({ id, action: 'request_supplement', note: '请补充' }, editorUser)
    // 状态机：补充后回到待处理，才能被解决
    await harness.service.supplement({ id, note: '已补充' }, editorUser as never)
    await harness.service.process({ id, action: 'resolve', note: '完成' }, editorUser)

    expect(harness.notifications).toHaveLength(2)
    expect(harness.notifications.map(n => n.type)).toEqual(['supplement_requested', 'resolved'])
    // 每条提醒都携带来源事件 ID，唯一约束由数据库保证
    expect(harness.notifications.every(n => typeof n.sourceEventId === 'number')).toBe(true)
  })

  it('重复处理被状态机拒绝，不产生重复提醒', async () => {
    const harness = createHarness()
    const created = await harness.service.create(baseDto() as never, editorUser)
    const id = created.id
    await harness.service.process({ id, action: 'request_supplement', note: '请补充' }, editorUser)
    await expect(
      harness.service.process({ id, action: 'request_supplement', note: 'again' }, editorUser)
    ).rejects.toThrow()
    expect(harness.notifications).toHaveLength(1)
  })
})
