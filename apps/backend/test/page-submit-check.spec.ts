import { BadRequestException, NotFoundException } from '@nestjs/common'
import type { IPageSchemaV2 } from '@cms/types'
import { PageService } from '../src/modules/page/page.service'
import { Page } from '../src/modules/page/entities/page.entity'
import { PublishLog } from '../src/modules/page/entities/publish-log.entity'

/**
 * 提交审核 / 发布的业务检查（后端侧）。
 *
 * 规则来自 @cms/types 的 checkPageForSubmit，与 CMS 编辑器同一份实现：
 * 这里验证「绕过前端直接调接口也会被拒绝」，以及失败时状态与快照都不写入。
 */
const makePage = (partial: Partial<Page>): Page =>
  Object.assign(new Page(), {
    id: 1,
    name: '测试页',
    schema: {},
    publishedSchema: null,
    publishedVersionId: null,
    publishedAt: null,
    componentList: [],
    isAbled: 0,
    status: 'draft',
    reviewNote: null,
    submittedBy: null,
    reviewedBy: null,
    reviewedAt: null,
    isDeleted: false,
    createTime: new Date(),
    updateTime: new Date(),
    ...partial
  })

const actor = { id: 'u1', username: 'admin' }

const validSchema = (): IPageSchemaV2 => ({
  version: '2.0.0',
  pageConfig: { name: '业务页面' },
  componentMap: {
    'rich-1': {
      id: 'rich-1',
      type: 'RichText',
      parentId: null,
      children: [],
      props: { content: '<p>正文</p>' },
      styles: {}
    }
  },
  rootIds: ['rich-1']
})

const invalidSchema = (): IPageSchemaV2 => ({
  version: '2.0.0',
  pageConfig: { name: '' },
  componentMap: {
    'form-1': {
      id: 'form-1',
      type: 'BusinessForm',
      parentId: null,
      children: [],
      props: {
        fields: [{ key: 'name', label: '姓名', type: 'text', required: true }]
      },
      styles: {}
    }
  },
  rootIds: ['form-1']
})

const createService = (page: Page) => {
  const pageRepo = {
    findOne: jest.fn().mockResolvedValue(page),
    save: jest.fn().mockImplementation((value: Page) => Promise.resolve(value))
  }
  const publishLogRepo = {}
  const userRepo = {}
  const savedLogs: unknown[] = []
  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === PublishLog) {
        return {
          save: jest.fn((value: unknown) => {
            savedLogs.push(value)
            return Promise.resolve(value)
          }),
          createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getRawOne: jest.fn().mockResolvedValue({ maxVersion: '0' })
          }))
        }
      }
      if (entity === Page) {
        return {
          save: jest.fn().mockImplementation((value: Page) => Promise.resolve(value)),
          createQueryBuilder: jest.fn(() => ({
            setLock: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getOne: jest.fn().mockResolvedValue(page)
          }))
        }
      }
      return {
        save: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getRawOne: jest.fn().mockResolvedValue({ maxVersion: '0' })
        }))
      }
    })
  }
  const dataSource = {
    transaction: jest.fn((cb: (m: unknown) => Promise<unknown>) => cb(manager))
  }
  const scenarioService = {
    ensureExists: jest.fn().mockResolvedValue({ id: 'scenario' })
  }

  const service = new PageService(
    pageRepo as never,
    publishLogRepo as never,
    dataSource as never,
    userRepo as never,
    scenarioService as never
  )

  return { service, pageRepo, savedLogs, scenarioService }
}

describe('PageService 提交审核与发布的业务检查', () => {
  it('发布前场景不存在：不写版本、不切换线上快照', async () => {
    const schema = validSchema()
    schema.pageConfig.businessScenarioId = '7a5e1cd4-2540-4b73-b1e4-4aa1b0e304f4'
    const page = makePage({ status: 'approved', schema })
    const { service, savedLogs, scenarioService, pageRepo } = createService(page)
    scenarioService.ensureExists.mockRejectedValue(new NotFoundException('业务场景不存在'))
    await expect(service.publishPage(1, actor)).rejects.toBeInstanceOf(NotFoundException)
    expect(savedLogs).toHaveLength(0)
    expect(pageRepo.save).not.toHaveBeenCalled()
    expect(page.status).toBe('approved')
    expect(page.publishedVersionId).toBeNull()
  })
  it('Schema 不合法时拒绝提交审核，且不改变状态', async () => {
    const page = makePage({ status: 'draft', schema: invalidSchema() })
    const { service, pageRepo } = createService(page)

    await expect(service.submitForReview(1, actor)).rejects.toBeInstanceOf(BadRequestException)

    expect(page.status).toBe('draft')
    expect(pageRepo.save).not.toHaveBeenCalled()
  })

  it('Schema 合法时提交审核通过', async () => {
    const page = makePage({ status: 'draft', schema: validSchema() })
    const { service, pageRepo } = createService(page)

    const result = await service.submitForReview(1, actor, '请审核')

    expect(page.status).toBe('pending_review')
    expect(result.id).toBe(1)
    expect(pageRepo.save).toHaveBeenCalled()
  })

  it('发布时 Schema 不合法：抛错、不写发布记录、状态不变', async () => {
    const page = makePage({
      status: 'approved',
      schema: invalidSchema(),
      reviewedBy: null
    })
    const { service, savedLogs } = createService(page)

    await expect(service.publishPage(1, actor)).rejects.toBeInstanceOf(BadRequestException)

    expect(savedLogs).toHaveLength(0)
    expect(page.status).toBe('approved')
    expect(page.publishedVersionId ?? null).toBeNull()
  })

  it('发布时 Schema 合法：写入发布记录并切换为已发布', async () => {
    const page = makePage({ status: 'approved', schema: validSchema() })
    const { service, savedLogs } = createService(page)

    const result = await service.publishPage(1, actor)

    expect(savedLogs).toHaveLength(1)
    expect(result.versionNo).toBe(1)
    expect(page.status).toBe('published')
    expect(page.isAbled).toBe(1)
  })
})
