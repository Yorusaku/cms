import { randomUUID } from 'crypto'
import { expect, test, type Browser, type Locator } from '@playwright/test'

/**
 * 票据异常无附件业务闭环（真实后端 + 专用库 cms_ticket_exception_e2e）。
 *
 * 覆盖：模板建页 → 预览无写请求 → 审核发布 → CRS 登录登记 → 查询详情
 *      → 另一账号要求补充 → 原提交人补充字段 → 解决 → 刷新查看历史。
 *
 * 约束：不跑清库脚本；数据带唯一前缀；处理动作走真实 UI / 接口，不直接改库。
 */
const BACKEND = 'http://127.0.0.1:3300'
const CRS_ORIGIN = 'http://127.0.0.1:3010/crs'
const CMS_ORIGIN = 'http://127.0.0.1:3011/cms-manage'
const PREFIX = `TK${Date.now().toString(36).toUpperCase()}`
const TEMPLATE_NAME = '票据信息缺失登记'

interface ApiResult {
  code: number
  message: string
  data: unknown
}

const api = async (
  route: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<ApiResult> => {
  const response = await fetch(`${BACKEND}${route}`, {
    method: options.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  })
  return (await response.json()) as ApiResult
}

const login = async (username: string, password: string): Promise<string> => {
  const result = await api('/atlas-cms/login', {
    body: { username, password }
  })
  const token = (result.data as { token?: string } | null)?.token
  if (result.code !== 10000 || !token) {
    throw new Error(`登录失败：${username}`)
  }
  return token
}

/** 注入登录态：CMS 与 CRS 在不同端口，各自独立写 localStorage */
const seedAuth = async (browser: Browser, origin: string, username: string, password: string) => {
  const token = await login(username, password)
  const context = await browser.newContext()
  await context.addInitScript(
    ([url, value]) => {
      if (window.location.href.startsWith(url)) {
        localStorage.setItem('token', value)
      }
    },
    [origin, token] as const
  )
  const page = await context.newPage()
  return { context, page }
}

const fillForm = async (
  scope: Locator,
  values: {
    ticketNo?: string
    exceptionType?: string
    description?: string
    issuedAt?: string
    invoiceType?: string
  }
) => {
  if (values.ticketNo !== undefined) {
    await scope.getByTestId('ticket-no').fill(values.ticketNo)
  }
  if (values.exceptionType !== undefined) {
    await scope.getByTestId('ticket-type').selectOption(values.exceptionType)
  }
  if (values.description !== undefined) {
    await scope.getByTestId('ticket-description').fill(values.description)
  }
  if (values.issuedAt !== undefined) {
    await scope.getByTestId('ticket-extra-issuedAt').fill(values.issuedAt)
  }
  if (values.invoiceType !== undefined) {
    await scope.getByTestId('ticket-extra-invoiceType').selectOption(values.invoiceType)
  }
}

test.describe.serial('票据异常无附件闭环', () => {
  let pageId = 0
  let versionId = ''
  let mainRecordId = 0
  let formComponentId = ''
  let scenarioIdOfFixture = ''
  const mainTicketNo = `${PREFIX}-A001`
  const otherTicketNos = Array.from({ length: 5 }, (_, index) => `${PREFIX}-B00${index + 2}`)

  test.beforeAll(async () => {
    const admin = await login('admin', 'admin123456')
    const editor = await login('editor', 'editor123')

    const templateList = await api('/atlas-cms/getTemplateList', {
      method: 'GET',
      token: editor
    })
    const templates = templateList.data as Array<{
      id: number
      name: string
      schema: unknown
    }>
    const template = templates.find(item => item.name === TEMPLATE_NAME)
    if (!template) {
      throw new Error(`模板缺失：${TEMPLATE_NAME}`)
    }
    // jsonb 字段可能已是对象，也可能是字符串，两种都兼容
    const templateSchema = (
      typeof template.schema === 'string' ? JSON.parse(template.schema) : template.schema
    ) as { componentMap?: Record<string, { type?: string }> }
    formComponentId =
      Object.entries(templateSchema.componentMap ?? {}).find(
        ([, component]) => component.type === 'TicketExceptionForm'
      )?.[0] ?? ''
    expect(formComponentId).toBeTruthy()

    const created = await api('/atlas-cms/createPageFromTemplate', {
      token: editor,
      body: { templateId: template.id, name: `${PREFIX} 票据异常登记` }
    })
    pageId = (created.data as { id: number }).id

    // 创建场景并绑定页面：业务页面提交审核必须绑定有效场景
    const scenario = await api('/atlas-cms/createBusinessScenario', {
      token: editor,
      body: { name: `${PREFIX} 场景`, description: 'E2E 场景' }
    })
    expect(scenario.code, scenario.message).toBe(10000)
    scenarioIdOfFixture = (scenario.data as { id: string }).id
    const pageJson = await api(`/atlas-cms/getPageJson?id=${pageId}`, {
      method: 'GET',
      token: editor
    })
    const rawSchema = (pageJson.data as { schema: unknown }).schema
    const bindingSchema = (typeof rawSchema === 'string' ? JSON.parse(rawSchema) : rawSchema) as {
      pageConfig: Record<string, unknown>
      rootIds: string[]
      version: string
    }
    bindingSchema.pageConfig.businessScenarioId = scenarioIdOfFixture
    await api('/atlas-cms/updateCmsJson', {
      token: editor,
      body: { id: pageId, name: `${PREFIX} 票据异常登记`, schema: bindingSchema }
    })

    // 审核发布：提交审核会跑共享发布检查，模板配置不合法这里就会失败
    const submitted = await api('/atlas-cms/submitPageReview', {
      token: editor,
      body: { pageId, note: '票据异常模板' }
    })
    expect(submitted.code, submitted.message).toBe(10000)

    await api('/atlas-cms/reviewPage', {
      token: admin,
      body: { pageId, decision: 'approved', note: '通过' }
    })
    const published = await api('/atlas-cms/publishPage', {
      token: admin,
      body: { pageId, note: '首次发布' }
    })
    versionId = (published.data as { versionId: string }).versionId
    expect(versionId).toBeTruthy()

    // 造 5 条其他记录：列表需要超过一页（pageSize=5）
    for (const ticketNo of otherTicketNos) {
      const result = await api('/atlas-cms/createTicketException', {
        token: editor,
        body: {
          requestId: crypto.randomUUID(),
          pageId,
          componentId: formComponentId,
          publishedVersionId: versionId,
          ticketNo,
          exceptionType: '票据信息缺失',
          description: '批量造数',
          extraFields: { issuedAt: '2026-10-01', invoiceType: '电子发票' }
        }
      })
      expect(result.code, result.message).toBe(10000)
    }
  })

  test('模板页发布成功，非法票据配置被发布检查拒绝', async () => {
    const editor = await login('editor', 'editor123')

    // 非法配置：扩展字段占用固定字段 key
    const invalidSchema = {
      version: '2.0.0',
      pageConfig: { name: `${PREFIX} 非法票据页` },
      componentMap: {
        'form-invalid': {
          id: 'form-invalid',
          type: 'TicketExceptionForm',
          parentId: null,
          children: [],
          props: {
            businessCategory: '报销票据',
            allowedExceptionTypes: '票据信息缺失',
            extraFields: [{ key: 'ticketNo', label: '票据号', type: 'text' }]
          },
          styles: {}
        }
      },
      rootIds: ['form-invalid']
    }
    const created = await api('/atlas-cms/addPageJson', {
      token: editor,
      body: { name: invalidSchema.pageConfig.name, schema: invalidSchema }
    })
    const invalidId = (created.data as { id: number }).id
    const submitted = await api('/atlas-cms/submitPageReview', {
      token: editor,
      body: { pageId: invalidId, note: '非法配置' }
    })
    expect(submitted.code).not.toBe(10000)
    expect(submitted.message).toContain('配置不合法')

    // 合法模板页：审核发布都成功（beforeAll 已完成，这里断言状态）
    const detail = await api(`/atlas-cms/getPublishedPage?id=${pageId}`, {
      method: 'GET'
    })
    expect(detail.code).toBe(10000)
    expect((detail.data as { publishedVersionId: string }).publishedVersionId).toBe(versionId)
  })

  test('预览页提交被拒绝且不发写请求', async ({ browser }) => {
    const { context, page } = await seedAuth(browser, CMS_ORIGIN, 'admin', 'admin123456')
    const writeRequests: string[] = []
    page.on('request', request => {
      if (
        request.method() === 'POST' &&
        request.url().includes('/atlas-cms/createTicketException')
      ) {
        writeRequests.push(request.url())
      }
    })

    // CMS 用 createWebHistory：路径不带 hash
    await page.goto(`${CMS_ORIGIN}/preview?id=${pageId}`)
    const frame = page.frameLocator('iframe')
    await expect(frame.getByTestId('ticket-no')).toBeVisible()

    await fillForm(frame as unknown as Locator, {
      ticketNo: `${PREFIX}-PREVIEW`,
      exceptionType: '票据信息缺失',
      description: '预览里不该写入',
      issuedAt: '2026-10-01',
      invoiceType: '电子发票'
    })
    await frame.getByTestId('ticket-submit').click()
    await expect(frame.getByText('当前为预览环境')).toBeVisible()
    expect(writeRequests, '预览页不应发起创建请求').toHaveLength(0)

    await context.close()
  })

  test('未登录提交提示登录并保留填写，登录后提交成功', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${CRS_ORIGIN}/#/page?id=${pageId}`)

    const form = page.locator('.ticket-exception-form')
    await expect(form).toBeVisible()
    await fillForm(form, { ticketNo: mainTicketNo })

    await page.getByTestId('ticket-submit').click()
    await expect(page.getByText('请先登录后再提交')).toBeVisible()
    // 内嵌登录弹层：不切路由，页面与已填内容都保留
    await expect(page.getByTestId('inline-login')).toBeVisible()

    await page.getByTestId('login-username').fill('editor')
    await page.getByTestId('login-password').fill('editor123')
    await page.getByTestId('login-submit').click()
    await expect(page.getByTestId('inline-login')).toHaveCount(0)
    await expect(page).toHaveURL(/#\/page\?id=/)

    const restored = page.locator('.ticket-exception-form')
    await expect(restored.getByTestId('ticket-no')).toHaveValue(mainTicketNo)

    await fillForm(restored, {
      exceptionType: '票据信息缺失',
      description: '缺少开票日期',
      issuedAt: '2026-10-01',
      invoiceType: '电子发票'
    })
    await page.getByTestId('ticket-submit').click()

    await expect(page.getByText('已登记')).toBeVisible()
    await expect(page.getByText('查看登记结果')).toBeVisible()
    await page.getByTestId('ticket-view-result').click()
    await expect(page).toHaveURL(/#\/ticketException\?id=/)
    await expect(page.locator('.ticket-detail-page')).toContainText(mainTicketNo)

    mainRecordId = Number(new URLSearchParams(page.url().split('?')[1]).get('id'))
    expect(mainRecordId).toBeGreaterThan(0)

    await context.close()
  })

  test('列表按关键词筛选、total 联动、翻页', async ({ browser }) => {
    const { context, page } = await seedAuth(browser, CRS_ORIGIN, 'editor', 'editor123')
    await page.goto(`${CRS_ORIGIN}/#/page?id=${pageId}`)

    const list = page.locator('.business-list-block')
    await expect(list).toBeVisible()

    // 专用库会累积历史轮次数据：用本轮唯一前缀筛选，得到确定的 6 条
    await page.getByTestId('list-keyword').fill(PREFIX)
    await expect(list.locator('tbody tr')).toHaveCount(5)
    await expect(list.getByTestId('list-page-indicator')).toHaveText('1 / 2')
    await expect(page.locator('.stat-card-block strong')).toHaveText('6')

    await page.getByTestId('list-keyword').fill(mainTicketNo)
    await expect(list.locator('tbody tr')).toHaveCount(1)
    await expect(list.locator('tbody tr').first()).toContainText(mainTicketNo)
    await expect(page.locator('.stat-card-block strong')).toHaveText('1')

    await page.getByTestId('list-keyword').fill(PREFIX)
    await expect(list.locator('tbody tr')).toHaveCount(5)
    await page.getByTestId('list-next-page').click()
    await expect(list.getByTestId('list-page-indicator')).toHaveText('2 / 2')
    await expect(list.locator('tbody tr')).toHaveCount(1)

    await context.close()
  })

  test('另一账号在 CMS 要求补充', async ({ browser }) => {
    const { context, page } = await seedAuth(browser, CMS_ORIGIN, 'admin', 'admin123456')
    await page.goto(`${CMS_ORIGIN}/ticket-exception`)

    await page.getByPlaceholder('按票据编号搜索').fill(mainTicketNo)
    await page.getByRole('button', { name: '查询' }).click()
    await page.getByRole('button', { name: '查看' }).first().click()

    const drawer = page.locator('.ticket-detail-drawer')
    await expect(drawer).toContainText(mainTicketNo)
    await drawer.getByPlaceholder('处理说明必填：说明原因或处理结果').fill('请补充开票日期')
    await drawer.getByRole('button', { name: '要求补充' }).click()
    await expect(drawer).toContainText('待补充')

    await context.close()
  })

  test('原提交人补充字段，历史记录本次补充', async ({ browser }) => {
    const { context, page } = await seedAuth(browser, CRS_ORIGIN, 'editor', 'editor123')
    await page.goto(`${CRS_ORIGIN}/#/ticketException?id=${mainRecordId}`)

    const detail = page.locator('.ticket-detail-page')
    await expect(detail).toContainText('待补充')
    await expect(detail).toContainText('补充信息')

    // 只改日期：其它字段保持原值，不被空值覆盖
    const dateInput = detail.locator('input[type="date"]')
    await dateInput.fill('2026-10-02')
    await detail.locator('textarea').first().fill('已补充开票日期')
    await page.getByTestId('supplement-submit').click()

    await expect(detail).toContainText('待处理')
    await expect(detail).toContainText('提交补充')
    await expect(detail).toContainText('开票日期：2026-10-02')

    await context.close()
  })

  test('非原提交人不能补充，viewer 只读', async ({ browser }) => {
    const admin = await login('admin', 'admin123456')
    const forbidden = await api('/atlas-cms/supplementTicketException', {
      token: admin,
      body: { id: mainRecordId, note: 'admin 越权补充' }
    })
    expect(forbidden.code).not.toBe(10000)

    const viewer = await login('viewer', 'viewer123')
    const viewerWrite = await api('/atlas-cms/createTicketException', {
      token: viewer,
      body: {}
    })
    expect(viewerWrite.code).not.toBe(10000)

    const { context, page } = await seedAuth(browser, CRS_ORIGIN, 'viewer', 'viewer123')
    await page.goto(`${CRS_ORIGIN}/#/ticketException?id=${mainRecordId}`)
    const detail = page.locator('.ticket-detail-page')
    await expect(detail).toContainText(mainTicketNo)
    await expect(detail.getByTestId('supplement-submit')).toHaveCount(0)
    await expect(detail.getByTestId('request-supplement')).toHaveCount(0)
    await expect(detail.getByTestId('resolve-ticket')).toHaveCount(0)
    await context.close()
  })

  test('解决后刷新查看完整历史，字段快照不随改版改变', async ({ browser }) => {
    const admin = await login('admin', 'admin123456')
    const editor = await login('editor', 'editor123')

    const resolved = await api('/atlas-cms/processTicketException', {
      token: admin,
      body: { id: mainRecordId, action: 'resolve', note: '已线下核实' }
    })
    expect(resolved.code, resolved.message).toBe(10000)

    // 模板改版：修改扩展字段显示名，历史记录仍按创建时快照展示
    const pageJson = await api(`/atlas-cms/getPageJson?id=${pageId}`, {
      method: 'GET',
      token: editor
    })
    const rawSchema = (pageJson.data as { schema: unknown }).schema
    const schema = (typeof rawSchema === 'string' ? JSON.parse(rawSchema) : rawSchema) as {
      componentMap: Record<string, { type: string; props: Record<string, unknown> }>
      pageConfig: Record<string, unknown>
      rootIds: string[]
      version: string
    }
    Object.values(schema.componentMap).forEach(component => {
      if (component.type === 'TicketExceptionForm') {
        component.props.extraFields = (
          component.props.extraFields as Array<Record<string, unknown>>
        ).map(field => (field.key === 'issuedAt' ? { ...field, label: '开票日期(新)' } : field))
      }
    })
    await api('/atlas-cms/updateCmsJson', {
      token: editor,
      body: { id: pageId, name: `${PREFIX} 改版`, schema }
    })

    const { context, page } = await seedAuth(browser, CRS_ORIGIN, 'editor', 'editor123')
    await page.goto(`${CRS_ORIGIN}/#/ticketException?id=${mainRecordId}`)
    const detail = page.locator('.ticket-detail-page')
    await expect(detail).toContainText('已解决')
    await expect(detail).toContainText('开票日期')
    await expect(detail).not.toContainText('开票日期(新)')

    const timeline = detail.locator('.timeline-item')
    await expect(timeline).toHaveCount(4)
    await expect(detail).toContainText('登记异常')
    await expect(detail).toContainText('要求补充')
    await expect(detail).toContainText('已解决')

    await context.close()
  })

  test('原提交人上传材料，处理人可读取，解决后材料保留', async ({ browser }) => {
    const editor = await login('editor', 'editor123')
    const published = await api(`/atlas-cms/getPublishedPage?id=${pageId}`, {
      method: 'GET'
    })
    const currentVersion = (published.data as { publishedVersionId: string }).publishedVersionId
    const created = await api('/atlas-cms/createTicketException', {
      token: editor,
      body: {
        requestId: randomUUID(),
        pageId,
        componentId: formComponentId,
        publishedVersionId: currentVersion,
        ticketNo: `${PREFIX}-MAT`,
        exceptionType: '票据信息缺失',
        description: '材料上传验证',
        extraFields: { issuedAt: '2026-10-01', invoiceType: '电子发票' }
      }
    })
    expect(created.code).toBe(10000)
    const recordId = (created.data as { id: number }).id

    const { context, page } = await seedAuth(browser, CRS_ORIGIN, 'editor', 'editor123')
    await page.goto(`${CRS_ORIGIN}/#/ticketException?id=${recordId}`)
    const detail = page.locator('.ticket-detail-page')
    await expect(detail).toContainText('图片材料')
    await expect(detail).toContainText('0 / 3')

    // 1x1 PNG（含合法文件头，服务端按文件头识别）
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c6360000002000148afa4710000000049454e44ae426082',
      'hex'
    )
    await page.getByTestId('material-file').setInputFiles({
      name: '质检单.png',
      mimeType: 'image/png',
      buffer: png
    })
    await page.getByTestId('material-upload').click()
    await expect(detail).toContainText('1 / 3')
    await expect(detail.locator('.material-thumb img').first()).toBeVisible()
    await expect(detail).toContainText('上传材料')
    await context.close()

    // 处理人（admin）经鉴权接口读取材料
    const adminToken = await login('admin', 'admin123456')
    const info = await api(`/atlas-cms/getTicketExceptionDetail?id=${recordId}`, {
      method: 'GET',
      token: adminToken
    })
    const attachments = (info.data as { attachments: Array<{ id: number }> }).attachments
    expect(attachments).toHaveLength(1)
    const blobResponse = await fetch(
      `${BACKEND}/atlas-cms/getTicketExceptionAttachment?id=${attachments[0].id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    )
    expect(blobResponse.headers.get('content-type')).toBe('image/png')
    expect(blobResponse.headers.get('cache-control')).toBe('private, no-store')
    await blobResponse.arrayBuffer()

    // 解决后：上传入口消失、材料保留、历史完整（登记+材料+解决）
    await api('/atlas-cms/processTicketException', {
      token: adminToken,
      body: { id: recordId, action: 'resolve', note: '已核实材料' }
    })
    const { context: ctx2, page: page2 } = await seedAuth(
      browser,
      CRS_ORIGIN,
      'editor',
      'editor123'
    )
    await page2.goto(`${CRS_ORIGIN}/#/ticketException?id=${recordId}`)
    const detail2 = page2.locator('.ticket-detail-page')
    await expect(detail2).toContainText('已解决')
    await expect(detail2).toContainText('1 / 3')
    await expect(detail2.getByTestId('material-upload')).toHaveCount(0)
    await expect(detail2.locator('.timeline-item')).toHaveCount(3)
    await ctx2.close()
  })
})
