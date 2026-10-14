import { PageService } from '../src/modules/page/page.service'
import { Page } from '../src/modules/page/entities/page.entity'
import { PublishLog } from '../src/modules/page/entities/publish-log.entity'
import { User } from '../src/modules/auth/entities/user.entity'

const makePage = (partial: Partial<Page>): Page => {
  const now = new Date()
  return Object.assign(
    new Page(),
    {
      id: 1,
      name: '测试页',
      schema: {},
      publishedSchema: null,
      publishedVersionId: null,
      publishedAt: null,
      componentList: [],
      shareDesc: '',
      shareImage: '',
      backgroundColor: '',
      backgroundImage: '',
      backgroundPosition: 'top',
      cover: '',
      isAbled: 0,
      status: 'draft',
      reviewNote: null,
      submittedBy: null,
      reviewedBy: null,
      reviewedAt: null,
      isDeleted: false,
      createTime: now,
      updateTime: now
    },
    partial
  )
}

const createService = (rows: Page[], total: number) => {
  const pageRepo = {
    findAndCount: jest.fn().mockResolvedValue([rows, total])
  }
  const publishLogRepo = {}
  const dataSource = {}
  const userRepo = {}
  const service = new PageService(
    pageRepo as never,
    publishLogRepo as never,
    dataSource as never,
    userRepo as never
  )
  return { service, pageRepo }
}

describe('PageService.getPublishedPageList', () => {
  it('只返回已上线且启用(isAbled=1)未删除的页面，并携带正确分页条件', async () => {
    const published = makePage({
      id: 1,
      name: '618 年中大促',
      isAbled: 1,
      status: 'published',
      publishedSchema: {} as never,
      publishedVersionId: 'seed-1-v1'
    })
    const { service, pageRepo } = createService([published], 1)

    const result = await service.getPublishedPageList({
      pageNum: 1,
      pageSize: 10
    })

    // 过滤条件：isDeleted:false + isAbled:1（不强制 status=published）
    expect(pageRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          isAbled: 1
        }),
        skip: 0,
        take: 10
      })
    )
    expect(result.total).toBe(1)
    expect(result.pageNum).toBe(1)
    expect(result.pageSize).toBe(10)
    expect(result.list).toHaveLength(1)
    expect(result.list[0]).toMatchObject({
      id: 1,
      name: '618 年中大促',
      isAbled: 1,
      status: 'published',
      publishedVersionId: 'seed-1-v1'
    })
  })

  it('按名称模糊过滤并应用正确分页偏移', async () => {
    const { service, pageRepo } = createService([], 0)

    await service.getPublishedPageList({
      pageNum: 3,
      pageSize: 5,
      name: '秒杀'
    })

    expect(pageRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          isAbled: 1,
          name: expect.anything()
        }),
        skip: 10,
        take: 5
      })
    )
    const where = pageRepo.findAndCount.mock.calls[0][0].where
    // name 使用 ILike 包装，确认确实传入了名称条件
    expect(where.name).not.toBeUndefined()
  })

  it('无论调用方是否传过滤条件，where 均固定 isAbled=1（不暴露草稿/下线页）', async () => {
    const { service, pageRepo } = createService([], 0)

    // 即使调用方不传 isAbled（默认可能期望看全部），公开列表也必须固定为已上线页面
    await service.getPublishedPageList({ pageNum: 1, pageSize: 20 })

    const where = pageRepo.findAndCount.mock.calls[0][0].where
    expect(where.isAbled).toBe(1)
    expect(where.isDeleted).toBe(false)
    // 内容状态可以为 approved/offline 等，线上快照仍按 publishedSchema 访问，不在此处强制 status
    expect(where.status).toBeUndefined()
  })
})

type SavedLog = Record<string, unknown>

/** 构造 publishPage / rollbackPageVersion 需要的 manager 桩 */
const createTransactionContext = (options: {
  page: Page
  maxVersion?: number
  sourceLog?: Record<string, unknown> | null
  reviewer?: { id: string; username: string } | null
}) => {
  const savedLogs: SavedLog[] = []
  const savedPages: Page[] = []

  const logRepo = {
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest
        .fn()
        .mockResolvedValue({ maxVersion: String(options.maxVersion ?? 0) })
    })),
    save: jest.fn(async (payload: SavedLog) => {
      savedLogs.push(payload)
      return payload
    }),
    findOne: jest.fn().mockResolvedValue(options.sourceLog ?? null)
  }

  const pageRepo = {
    createQueryBuilder: jest.fn(() => ({
      setLock: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(options.page)
    })),
    save: jest.fn(async (payload: Page) => {
      savedPages.push(payload)
      return payload
    })
  }

  const userRepo = {
    findOne: jest.fn().mockResolvedValue(options.reviewer ?? null)
  }

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === PublishLog) return logRepo
      if (entity === User) return userRepo
      return pageRepo
    })
  }

  const dataSource = {
    transaction: jest.fn(async (cb: (m: unknown) => Promise<unknown>) => cb(manager))
  }

  return { dataSource, savedLogs, savedPages, logRepo, userRepo }
}

const createTransactionalService = (context: ReturnType<typeof createTransactionContext>) =>
  new PageService(
    { findOne: jest.fn().mockResolvedValue(context.savedPages[0]) } as never,
    { find: jest.fn().mockResolvedValue([]) } as never,
    context.dataSource as never,
    {} as never
  )

describe('PageService 发布日志角色快照', () => {
  it('发布时写入审核人与发布人快照（审核人由 reviewedBy 解析为用户名）', async () => {
    const page = makePage({
      id: 12,
      status: 'approved',
      schema: { pageConfig: {} } as never,
      reviewedBy: 'u-reviewer'
    })
    const context = createTransactionContext({
      page,
      maxVersion: 2,
      reviewer: { id: 'u-reviewer', username: '审核员甲' }
    })
    const service = createTransactionalService(context)

    await service.publishPage(12, { id: 'u-publisher', username: '发布员乙' })

    expect(context.savedLogs).toHaveLength(1)
    expect(context.savedLogs[0]).toMatchObject({
      pageId: 12,
      action: 'publish',
      operator: '发布员乙',
      reviewerName: '审核员甲',
      publisherName: '发布员乙',
      rollbackerName: null,
      displayVersion: 'v3'
    })
    expect(page.status).toBe('published')
    expect(page.isAbled).toBe(1)
  })

  it('审核人查不到用户时 reviewerName 为 null，不影响发布', async () => {
    const page = makePage({
      id: 13,
      status: 'approved',
      schema: { pageConfig: {} } as never,
      reviewedBy: 'u-missing'
    })
    const context = createTransactionContext({ page, reviewer: null })
    const service = createTransactionalService(context)

    await service.publishPage(13, { id: 'u-publisher', username: '发布员乙' })

    expect(context.savedLogs[0]).toMatchObject({
      reviewerName: null,
      publisherName: '发布员乙'
    })
  })

  it('非 approved 状态不能发布', async () => {
    const page = makePage({ id: 14, status: 'pending_review', schema: { pageConfig: {} } as never })
    const context = createTransactionContext({ page })
    const service = createTransactionalService(context)

    await expect(
      service.publishPage(14, { id: 'u-publisher', username: '发布员乙' })
    ).rejects.toThrow('页面必须审核通过后才能发布')
    expect(context.savedLogs).toHaveLength(0)
  })
})

describe('PageService 回滚日志角色快照', () => {
  it('回滚写入回滚人并继承源版本的审核人与发布人', async () => {
    const page = makePage({ id: 15, status: 'published', publishedVersionId: 'v-old' })
    const context = createTransactionContext({
      page,
      maxVersion: 4,
      sourceLog: {
        versionId: 'v-old',
        displayVersion: 'v4',
        reviewerName: '审核员甲',
        publisherName: '发布员乙',
        schemaSnapshot: { pageConfig: {} }
      }
    })
    const service = createTransactionalService(context)

    await service.rollbackPageVersion(15, 'v-old', { id: 'u-admin', username: '管理员丙' })

    expect(context.savedLogs).toHaveLength(1)
    expect(context.savedLogs[0]).toMatchObject({
      pageId: 15,
      action: 'rollback',
      operator: '管理员丙',
      reviewerName: '审核员甲',
      publisherName: '发布员乙',
      rollbackerName: '管理员丙',
      sourceVersionId: 'v-old',
      note: '回滚至 v4'
    })
    expect(context.savedLogs[0].schemaSnapshot).toEqual({ pageConfig: {} })
  })

  it('源版本不存在时抛错且不落日志', async () => {
    const page = makePage({ id: 16 })
    const context = createTransactionContext({ page, sourceLog: null })
    const service = createTransactionalService(context)

    await expect(
      service.rollbackPageVersion(16, 'v-missing', { id: 'u-admin', username: '管理员丙' })
    ).rejects.toThrow('未找到该发布版本')
    expect(context.savedLogs).toHaveLength(0)
  })
})

describe('PageService.getPagePublishLogs', () => {
  it('返回角色快照字段并标记当前线上版本', async () => {
    const page = makePage({ id: 21, publishedVersionId: 'ver-2' })
    const logs = [
      Object.assign(new PublishLog(), {
        versionId: 'ver-2',
        pageId: 21,
        displayVersion: 'v2',
        versionNo: 2,
        action: 'rollback',
        operator: '管理员丙',
        reviewerName: '审核员甲',
        publisherName: '发布员乙',
        rollbackerName: '管理员丙',
        note: '回滚至 v1',
        sourceVersionId: 'ver-1',
        publishedAt: new Date('2026-09-30T08:00:00.000Z')
      }),
      Object.assign(new PublishLog(), {
        versionId: 'ver-1',
        pageId: 21,
        displayVersion: 'v1',
        versionNo: 1,
        action: 'publish',
        operator: '发布员乙',
        reviewerName: null,
        publisherName: null,
        rollbackerName: null,
        note: '发布',
        sourceVersionId: null,
        publishedAt: new Date('2026-09-29T08:00:00.000Z')
      })
    ]

    const pageRepo = { findOne: jest.fn().mockResolvedValue(page) }
    const publishLogRepo = { find: jest.fn().mockResolvedValue(logs) }
    const service = new PageService(
      pageRepo as never,
      publishLogRepo as never,
      {} as never,
      {} as never
    )

    const result = await service.getPagePublishLogs(21)

    expect(result[0]).toMatchObject({
      versionId: 'ver-2',
      reviewerName: '审核员甲',
      publisherName: '发布员乙',
      rollbackerName: '管理员丙',
      isCurrent: true,
      action: 'rollback'
    })
    expect(result[1]).toMatchObject({
      versionId: 'ver-1',
      reviewerName: null,
      publisherName: null,
      rollbackerName: null,
      isCurrent: false
    })
  })
})
