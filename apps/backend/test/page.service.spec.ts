import { PageService } from '../src/modules/page/page.service'
import { Page } from '../src/modules/page/entities/page.entity'

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
  const service = new PageService(pageRepo as never, publishLogRepo as never, dataSource as never)
  return { service, pageRepo }
}

describe('PageService.getPublishedPageList', () => {
  it('只返回已上线(published)且启用(isAbled=1)未删除的页面，并携带正确分页条件', async () => {
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

    // 过滤条件：isDeleted:false + isAbled:1 + status:published
    expect(pageRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isDeleted: false,
          isAbled: 1,
          status: 'published'
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
          status: 'published',
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

  it('无论调用方是否传过滤条件，where 均固定 status=published 且 isAbled=1（不暴露草稿/下线页）', async () => {
    const { service, pageRepo } = createService([], 0)

    // 即使调用方不传 isAbled（默认可能期望看全部），公开列表也必须固定为已上线页面
    await service.getPublishedPageList({ pageNum: 1, pageSize: 20 })

    const where = pageRepo.findAndCount.mock.calls[0][0].where
    expect(where.status).toBe('published')
    expect(where.isAbled).toBe(1)
    expect(where.isDeleted).toBe(false)
  })
})
