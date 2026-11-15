import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Browser, type Page } from '@playwright/test'

const CMS = 'http://127.0.0.1:3011/cms-manage'
const CRS = 'http://127.0.0.1:3010/crs/#'
const API = 'http://127.0.0.1:3300/atlas-cms'
const prefix = `SW${Date.now().toString(36)}`
const testDir = path.dirname(fileURLToPath(import.meta.url))
const shots = path.resolve(testDir, '../../../../../tmp/acceptance/scenario-review')
const backendDir = path.resolve(testDir, '../../../../backend')
const backendRequire = createRequire(path.join(backendDir, 'package.json'))

interface Result<T> {
  code: number
  message: string
  data: T
}
const api = async <T = Record<string, unknown>>(
  endpoint: string,
  token: string,
  body?: unknown
): Promise<Result<T>> => {
  const result = await fetch(`${API}/${endpoint}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  return result.json() as Promise<Result<T>>
}
const ok = async <T>(promise: Promise<Result<T>>): Promise<T> => {
  const result = await promise
  expect(result.code, result.message).toBe(10000)
  return result.data
}
const login = (username: string, password: string) =>
  ok(api<{ token: string }>('login', '', { username, password })).then(item => item.token)

const open = async (browser: Browser, token: string, url: string) => {
  const context = await browser.newContext()
  await context.addInitScript(value => {
    if (
      location.origin === 'http://127.0.0.1:3011' ||
      location.origin === 'http://127.0.0.1:3010'
    ) {
      localStorage.setItem('token', value)
    }
  }, token)
  const page = await context.newPage()
  await page.goto(url)
  return { context, page }
}
const screenshot = async (page: Page, name: string, width: number) => {
  await page.setViewportSize({ width, height: 900 })
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth))
    .toBeLessThanOrEqual(1)
  await page.screenshot({ path: path.join(shots, `${name}-${width}.png`), fullPage: true })
}

const schemaFor = (name: string, scenarioId?: string) => ({
  version: '2.0.0',
  pageConfig: {
    name,
    layoutMode: 'business',
    ...(scenarioId ? { businessScenarioId: scenarioId } : {})
  },
  componentMap: {
    form: {
      id: 'form',
      type: 'TicketExceptionForm',
      parentId: null,
      children: [],
      styles: {},
      props: {
        title: '异常登记',
        businessCategory: '验收票据',
        allowedExceptionTypes: ['信息缺失'],
        extraFields: [{ key: 'reference', label: '原始凭证号', type: 'text' }]
      }
    },
    stat: {
      id: 'stat',
      type: 'StatCard',
      parentId: null,
      children: [],
      styles: {},
      props: { title: '当前筛选记录', value: 0 }
    },
    list: {
      id: 'list',
      type: 'BusinessList',
      parentId: null,
      children: [],
      styles: {},
      props: {
        title: '场景记录',
        dataSource: 'ticketExceptions',
        pageSize: 5,
        columns: [
          { key: 'ticketNo', label: '票据编号' },
          { key: 'status', label: '状态' }
        ],
        rows: []
      }
    }
  },
  rootIds: ['form', 'stat', 'list'],
  linkages: [
    {
      id: 'count',
      sourceComponentId: 'list',
      sourceProperty: 'filteredCount',
      targetComponentId: 'stat',
      targetProperty: 'value',
      enabled: true
    }
  ]
})
type Schema = ReturnType<typeof schemaFor>
interface Published {
  id: number
  version: string
  schema: Schema
}

test.describe.serial('场景复用、待办和站内提醒真实验收', () => {
  let admin = ''
  let submitter = ''
  let submitterId = ''
  let sceneA = ''
  let sceneB = ''
  let a1: Published
  let a2: Published
  let b: Published
  let recordId = 0
  let messageId = 0
  let requestId = ''
  const username = prefix.slice(0, 18)
  const password = 'TicketTest123'
  const ticketNo = `${prefix}-A1`

  const publish = async (id: number) => {
    await ok(api('submitPageReview', admin, { pageId: id }))
    await ok(api('reviewPage', admin, { pageId: id, decision: 'approved' }))
    return (await ok(api<{ versionId: string }>('publishPage', admin, { pageId: id }))).versionId
  }
  const createPage = async (suffix: string, scene: string): Promise<Published> => {
    const schema = schemaFor(`${prefix}-${suffix}`, scene)
    const { id } = await ok(
      api<{ id: number }>('addPageJson', admin, { name: schema.pageConfig.name, schema })
    )
    return { id, schema, version: await publish(id) }
  }
  const createRecord = async (page: Published, number: string, retryId = randomUUID()) => {
    return ok(
      api<{ id: number; duplicated: boolean }>('createTicketException', submitter, {
        requestId: retryId,
        pageId: page.id,
        componentId: 'form',
        publishedVersionId: page.version,
        ticketNo: number,
        exceptionType: '信息缺失',
        description: '验收异常',
        extraFields: { reference: 'REF-OLD' }
      })
    )
  }

  test.beforeAll(async () => {
    await mkdir(shots, { recursive: true })
    admin = await login('admin', 'admin123456')
    const user = await ok(
      api<{ id: string }>('createUser', admin, { username, password, role: 'editor' })
    )
    submitterId = user.id
    submitter = await login(username, password)
  })

  test('CMS 创建编辑场景，通过页面设置绑定，跨页面汇总且场景不混查', async ({ browser }) => {
    const { context, page } = await open(browser, admin, `${CMS}/business-scenario`)
    for (const label of ['A', 'B']) {
      await page.getByRole('button', { name: '新建场景' }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByPlaceholder('场景名称').fill(`${prefix}-${label}`)
      await dialog.locator('textarea').fill('真实浏览器验收场景')
      const response = page.waitForResponse(r => r.url().includes('createBusinessScenario'))
      await dialog.getByRole('button', { name: '保存', exact: true }).click()
      const result = (await (await response).json()) as Result<{ id: string }>
      expect(result.code).toBe(10000)
      if (label === 'A') sceneA = result.data.id
      else sceneB = result.data.id
      await expect(dialog).not.toBeVisible()
    }
    const row = page.locator('.el-table__row').filter({ hasText: `${prefix}-A` })
    await row.getByRole('button', { name: '编辑' }).click()
    await page.getByRole('dialog').getByPlaceholder('场景名称').fill(`${prefix}-A-renamed`)
    await page.getByRole('dialog').getByRole('button', { name: '保存', exact: true }).click()
    await expect(row).toContainText('renamed')
    await screenshot(page, 'cms-scenarios', 1280)

    a1 = await createPage('A1', sceneA)
    a2 = await createPage('A2', sceneA)
    b = await createPage('B', sceneB)
    await page.goto(`${CMS}/decorate?id=${a1.id}`)
    await page.getByText('页面设置', { exact: true }).click()
    const binding = page.locator('.page-setting .el-select')
    await binding.click()
    await page.getByRole('option', { name: `${prefix}-B`, exact: true }).click()
    await expect(page.locator('.scenario-notice')).toContainText('重新发布')
    await page.getByRole('button', { name: '保存草稿', exact: true }).click()
    await expect
      .poll(async () => {
        const result = await ok(api<{ schema: Schema }>(`getPageJson?id=${a1.id}`, admin))
        return result.schema.pageConfig.businessScenarioId
      })
      .toBe(sceneB)
    // 未发布的绑定变化不影响线上版本与新登记。
    requestId = randomUUID()
    recordId = (await createRecord(a1, ticketNo, requestId)).id
    await createRecord(a2, `${prefix}-A2`)
    await createRecord(b, `${prefix}-B`)
    const crs = await open(browser, submitter, `${CRS}/page?id=${a1.id}`)
    await expect(crs.page.locator('.business-list-block tbody tr')).toHaveCount(2)
    await expect(crs.page.locator('.business-list-block')).toContainText(`${prefix}-A2`)
    await expect(crs.page.locator('.stat-card-block')).toContainText('2')
    await crs.page.goto(`${CRS}/page?id=${b.id}`)
    await expect(crs.page.locator('.business-list-block tbody tr')).toHaveCount(1)
    await expect(crs.page.locator('.business-list-block')).not.toContainText(ticketNo)
    expect(
      await crs.page
        .locator('.business-nav button')
        .first()
        .evaluate(element => parseFloat(getComputedStyle(element).fontSize))
    ).toBeCloseTo(13, 1)
    await screenshot(crs.page, 'crs-published-business', 1280)
    await crs.context.close()
    await context.close()
  })

  test('共享待处理池要求补充，个人待办与两端消息已读同步，完成补充和解决', async ({ browser }) => {
    const cms = await open(browser, admin, `${CMS}/ticket-exception`)
    await cms.page.getByRole('tab', { name: '待处理', exact: true }).click()
    await cms.page.getByPlaceholder('按票据编号搜索').fill(ticketNo)
    await cms.page.getByRole('button', { name: '查询', exact: true }).click()
    const row = cms.page.locator('.el-table__row').filter({ hasText: ticketNo })
    await row.getByRole('button', { name: '查看', exact: true }).click()
    const drawer = cms.page.locator('.ticket-detail-drawer')
    await drawer.getByPlaceholder('处理说明必填：说明原因或处理结果').fill('请补充原始凭证号')
    await drawer.getByRole('button', { name: '要求补充', exact: true }).click()
    await expect(drawer).toContainText('待补充')
    await screenshot(cms.page, 'cms-workbench', 1440)

    const crs = await open(browser, submitter, `${CRS}/myTickets`)
    await crs.page.getByRole('combobox', { name: '业务场景' }).selectOption(sceneA)
    await expect(crs.page.getByTestId(`my-ticket-${recordId}`)).toBeVisible()
    await screenshot(crs.page, 'crs-my-tickets', 390)
    await crs.page.getByRole('button', { name: '消息', exact: true }).click()
    await crs.page.getByRole('combobox', { name: '业务场景' }).selectOption(sceneA)
    await crs.page.getByTestId('notifications-unread').click()
    await expect(crs.page.locator('.notification-row')).toHaveCount(1)
    const messages = await ok(
      api<{ items: Array<{ id: number }> }>(`getNotificationList?scenarioId=${sceneA}`, submitter)
    )
    messageId = messages.items[0].id
    await screenshot(crs.page, 'crs-messages', 390)
    const personalCms = await open(browser, submitter, `${CMS}/notifications?scenarioId=${sceneA}`)
    const notificationRow = personalCms.page
      .locator('.el-table__row')
      .filter({ hasText: String(recordId) })
    await notificationRow.getByRole('button', { name: '标为已读' }).click()
    await expect(notificationRow).toContainText('已读')
    await screenshot(personalCms.page, 'cms-messages', 1280)
    await screenshot(personalCms.page, 'cms-messages', 1440)
    await crs.page.getByRole('button', { name: '刷新', exact: true }).click()
    await expect(crs.page.getByTestId(`notification-${messageId}`)).toHaveCount(0)
    await crs.page.getByRole('button', { name: '全部', exact: true }).click()
    await crs.page.getByTestId(`notification-${messageId}`).click()
    await expect(crs.page.locator('.ticket-detail-page')).toContainText(ticketNo)
    await crs.page.locator('input[type="text"]').last().fill('REF-NEW')
    await crs.page.locator('textarea').first().fill('已补齐凭证号')
    await crs.page.getByTestId('supplement-submit').click()
    await expect(crs.page.locator('.ticket-detail-page')).toContainText('待处理')
    await crs.page.goto(`${CRS}/myTickets`)
    await crs.page.getByRole('combobox', { name: '业务场景' }).selectOption(sceneA)
    await expect(crs.page.getByTestId(`my-ticket-${recordId}`)).toHaveCount(0)
    await crs.page.getByTestId('my-view-mineSubmitted').click()
    await expect(crs.page.getByTestId(`my-ticket-${recordId}`)).toBeVisible()
    await screenshot(crs.page, 'crs-my-tickets', 1280)

    await ok(
      api('processTicketException', admin, { id: recordId, action: 'resolve', note: '已核对解决' })
    )
    await personalCms.page.getByRole('button', { name: '刷新', exact: true }).click()
    const resolvedRow = personalCms.page.locator('.el-table__row').filter({ hasText: '处理完成' })
    await resolvedRow.getByRole('button', { name: '查看记录' }).click()
    await expect(personalCms.page.locator('.ticket-detail-drawer')).toContainText('已解决')
    await crs.page.goto(`${CRS}/notifications`)
    await crs.page.getByRole('combobox', { name: '业务场景' }).selectOption(sceneA)
    await expect(crs.page.locator('.notification-row')).toHaveCount(2)
    await screenshot(crs.page, 'crs-messages', 1280)
    await Promise.all([cms.context.close(), crs.context.close(), personalCms.context.close()])
  })

  test('重新绑定后新旧记录归属与字段快照不变，旧请求重试仍返回原记录', async () => {
    const oldVersion = a1.version
    a1.version = await publish(a1.id)
    const created = await createRecord(a1, `${prefix}-REBOUND`)
    const old = await ok(
      api<{ businessScenarioId: string; fieldSnapshot: unknown }>(
        `getTicketExceptionDetail?id=${recordId}`,
        admin
      )
    )
    const next = await ok(
      api<{ businessScenarioId: string }>(`getTicketExceptionDetail?id=${created.id}`, admin)
    )
    expect(old.businessScenarioId).toBe(sceneA)
    expect(JSON.stringify(old.fieldSnapshot)).toContain('原始凭证号')
    expect(next.businessScenarioId).toBe(sceneB)
    const retry = await createRecord({ ...a1, version: oldVersion }, ticketNo, requestId)
    expect(retry).toEqual({ id: recordId, duplicated: true })
    const rejected = await api('createTicketException', submitter, {
      requestId: randomUUID(),
      pageId: a1.id,
      componentId: 'form',
      publishedVersionId: oldVersion,
      ticketNo: `${prefix}-STALE`,
      exceptionType: '信息缺失',
      description: '旧版本新提交'
    })
    expect(rejected.code).not.toBe(10000)
  })

  test('提醒失败真实回滚，按用户 ID 找改名账号，重复处理不重复提醒', async () => {
    const env = backendRequire('dotenv').parse(readFileSync(path.join(backendDir, '.env')))
    const Client = backendRequire('pg').Client
    const db = new Client({
      host: env.DB_HOST || '127.0.0.1',
      port: Number(env.DB_PORT || 5433),
      user: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: 'cms_ticket_exception_e2e'
    })
    await db.connect()
    const constraint = `accept_notification_${Date.now()}`
    const victim = (await createRecord(a2, `${prefix}-ROLLBACK`)).id
    try {
      expect((await db.query('select current_database() as name')).rows[0].name).toBe(
        'cms_ticket_exception_e2e'
      )
      await db.query(
        `ALTER TABLE notifications ADD CONSTRAINT "${constraint}" CHECK (exception_id <> ${victim}) NOT VALID`
      )
      const failed = await api('processTicketException', admin, {
        id: victim,
        action: 'request_supplement',
        note: '故障注入'
      })
      expect(failed.code).not.toBe(10000)
      const detail = await ok(
        api<{ status: string; events: unknown[] }>(`getTicketExceptionDetail?id=${victim}`, admin)
      )
      expect(detail.status).toBe('pending')
      expect(detail.events).toHaveLength(1)
      expect(
        (
          await db.query('select count(*)::int as n from notifications where exception_id=$1', [
            victim
          ])
        ).rows[0].n
      ).toBe(0)
    } finally {
      await db.query(`ALTER TABLE notifications DROP CONSTRAINT IF EXISTS "${constraint}"`)
      await db.end()
    }
    const renamed = `${username}r`
    const renameDb = new Client({
      host: env.DB_HOST || '127.0.0.1',
      port: Number(env.DB_PORT || 5433),
      user: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: 'cms_ticket_exception_e2e'
    })
    await renameDb.connect()
    try {
      await renameDb.query('update users set username=$1 where id=$2', [renamed, submitterId])
      const results = await Promise.all(
        [1, 2].map(() =>
          api('processTicketException', admin, {
            id: victim,
            action: 'request_supplement',
            note: '改名后请求补充'
          })
        )
      )
      expect(results.filter(result => result.code === 10000)).toHaveLength(1)
      const messages = await renameDb.query(
        'select recipient_user_id from notifications where exception_id=$1',
        [victim]
      )
      expect(messages.rows).toEqual([{ recipient_user_id: submitterId }])
      const events = await renameDb.query(
        'select count(*)::int as n from ticket_exception_events where exception_id=$1',
        [victim]
      )
      expect(events.rows[0].n).toBe(2)
    } finally {
      await renameDb.query('update users set username=$1 where id=$2', [username, submitterId])
      await renameDb.end()
    }
  })

  test('个人提交按场景分页，第二页记录可达，切换场景回到第一页', async ({ browser }) => {
    for (let index = 0; index < 21; index += 1) {
      await createRecord(a2, `${prefix}-PAGE-${index}`)
    }
    const ui = await open(browser, submitter, `${CRS}/myTickets`)
    await ui.page.getByTestId('my-view-mineSubmitted').click()
    await ui.page.getByRole('combobox', { name: '业务场景' }).selectOption(sceneA)
    await expect(ui.page.locator('.ticket-row')).toHaveCount(20)
    const firstId = await ui.page.locator('.ticket-row').first().getAttribute('data-testid')
    await ui.page.getByRole('button', { name: '下一页', exact: true }).click()
    await expect(ui.page.locator('.ticket-row')).toHaveCount(4)
    expect(await ui.page.locator('.ticket-row').first().getAttribute('data-testid')).not.toBe(
      firstId
    )
    await ui.page.getByRole('combobox', { name: '业务场景' }).selectOption(sceneB)
    await expect(ui.page.locator('.ticket-row')).toHaveCount(2)
    await screenshot(ui.page, 'crs-my-tickets', 1440)
    await ui.context.close()
  })

  test('未登录不可读个人消息，viewer 只读，他人不能改消息，手机入口可达', async ({ browser }) => {
    expect((await api('getNotificationList', '')).code).not.toBe(10000)
    const own = await ok(
      api<{ items: Array<{ id: number; read: boolean }> }>('getNotificationList', submitter)
    )
    const unread = own.items.find(item => !item.read)!
    expect(unread).toBeTruthy()
    await ok(api(`markNotificationRead/${unread.id}`, admin, {}))
    const foreign = await ok(api<{ items: Array<{ id: number }> }>('getNotificationList', admin))
    expect(foreign.items.some(item => item.id === unread.id)).toBe(false)
    const unchanged = await ok(
      api<{ items: Array<{ id: number; read: boolean }> }>('getNotificationList', submitter)
    )
    expect(unchanged.items.find(item => item.id === unread.id)?.read).toBe(false)
    const viewer = await login('viewer', 'viewer123')
    const ui = await open(browser, viewer, `${CMS}/business-scenario`)
    await expect(ui.page.getByRole('heading', { name: '业务场景' })).toBeVisible()
    await expect(ui.page.getByRole('button', { name: '新建场景' })).toHaveCount(0)
    await ui.page.goto(`${CMS}/ticket-exception`)
    await expect(ui.page.getByRole('tab', { name: '待处理', exact: true })).toHaveCount(0)
    await ui.page.goto(`${CRS}/page?id=${a1.id}`)
    await ui.page.setViewportSize({ width: 390, height: 844 })
    await ui.page.getByTestId('nav-my-tickets').click()
    await expect(ui.page.getByTestId('my-view-mineSubmitted')).toBeVisible()
    await ui.context.close()
  })
})
