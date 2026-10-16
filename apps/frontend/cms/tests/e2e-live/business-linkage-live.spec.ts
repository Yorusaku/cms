import { expect, test, type Page } from '@playwright/test'
import { LoginPage } from '../e2e/pages/login.page'

/**
 * 业务查询页联动闭环（e2e-live）：
 * 创建带 linkages 的查询页 → 提交审核 → 审核通过 → 发布
 * → CRS 正式发布页输入关键词 → 列表与统计卡片同步变化。
 *
 * 建页/审核/发布走真实接口（page.request），联动验证走 CRS 真实渲染链路，
 * 同时确认「发布后的 schema 完整保留了 linkages」。
 */

const BACKEND = 'http://127.0.0.1:3300'
const CRS_ORIGIN = 'http://127.0.0.1:3010'

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page)
  await login.login('admin', 'admin123456')
  await page.waitForURL(/\/activity/, { timeout: 15000 })
}

test.describe.serial('业务查询页联动闭环（发布页 → 筛选 → 统计联动）', () => {
  let pageId: number | null = null
  const pageName = `E2E_业务查询_${Date.now()}`

  const rows = [
    { id: 1, name: '服务申请', status: '处理中' },
    { id: 2, name: '资料补交', status: '已完成' },
    { id: 3, name: '预约办理', status: '处理中' },
    { id: 4, name: '服务评价', status: '已完成' },
    { id: 5, name: '资料审核', status: '已驳回' },
    { id: 6, name: '服务续期', status: '处理中' }
  ]

  const queryPageSchema = {
    version: '2.0.0',
    pageConfig: {
      name: pageName,
      scene: 'list',
      shareDesc: '查询业务办理状态',
      shareImage: '',
      backgroundColor: '#f8fafc',
      backgroundImage: '',
      backgroundPosition: 'top',
      cover: ''
    },
    componentMap: {
      stat: {
        id: 'stat',
        type: 'StatCard',
        parentId: null,
        children: [],
        props: {
          title: '匹配记录数',
          value: rows.length,
          description: '随筛选实时变化',
          icon: '数',
          accentColor: '#419bf9'
        },
        styles: {}
      },
      list: {
        id: 'list',
        type: 'BusinessList',
        parentId: null,
        children: [],
        props: {
          title: '办理记录',
          subtitle: '输入关键词筛选，上方统计同步变化',
          columns: [
            { key: 'name', label: '事项' },
            { key: 'status', label: '状态' }
          ],
          rows,
          pageSize: 5
        },
        styles: {}
      }
    },
    rootIds: ['stat', 'list'],
    linkages: [
      {
        id: 'linkage-filtered-count',
        sourceComponentId: 'list',
        targetComponentId: 'stat',
        sourceProperty: 'filteredCount',
        targetProperty: 'value',
        enabled: true
      }
    ]
  }

  test('1) 创建业务查询页并审核发布', async ({ page }) => {
    await loginAsAdmin(page)
    const token = await page.evaluate(() => localStorage.getItem('token'))
    const headers = { Authorization: `Bearer ${token}` }

    const createResp = await page.request.post(`${BACKEND}/atlas-cms/addPageJson`, {
      headers,
      data: { name: pageName, schema: queryPageSchema }
    })
    const createBody = await createResp.json()
    expect(createBody.code).toBe(10000)
    pageId = Number(createBody.data?.id)
    expect(pageId).toBeGreaterThan(0)

    const reviewResp = await page.request.post(`${BACKEND}/atlas-cms/submitPageReview`, {
      headers,
      data: { pageId, note: 'e2e 提交审核' }
    })
    expect((await reviewResp.json()).code).toBe(10000)

    const approveResp = await page.request.post(`${BACKEND}/atlas-cms/reviewPage`, {
      headers,
      data: { pageId, decision: 'approved', note: 'e2e 审核通过' }
    })
    expect((await approveResp.json()).code).toBe(10000)

    const publishResp = await page.request.post(`${BACKEND}/atlas-cms/publishPage`, {
      headers,
      data: { pageId, note: 'e2e 发布' }
    })
    const publishBody = await publishResp.json()
    expect(publishBody.code).toBe(10000)
    expect(publishBody.data?.versionId).toBeTruthy()
  })

  test('2) 发布页筛选关键词，统计卡片联动', async ({ page }) => {
    expect(pageId).not.toBeNull()

    const pub = await page.request.get(`${BACKEND}/atlas-cms/getPublishedPage?id=${pageId}`)
    const pubBody = await pub.json()
    expect(pubBody.code).toBe(10000)
    // 发布后的 schema 必须完整保留 linkages，否则渲染端无从建立联动
    expect(pubBody.data?.schema?.linkages?.length).toBe(1)

    await page.goto(`${CRS_ORIGIN}/crs/#/page?id=${pageId}`)

    const list = page.locator('.business-list-block')
    const statValue = page.locator('.stat-card-block .stat-content strong')

    await expect(list).toBeVisible({ timeout: 15000 })
    await expect(statValue).toHaveText(String(rows.length))

    // 命中 2 条（资料补交 / 资料审核）
    await list.locator('.search-input').fill('资料')
    await expect(list.locator('tbody tr')).toHaveCount(2, { timeout: 5000 })
    await expect(statValue).toHaveText('2', { timeout: 5000 })
  })
})
