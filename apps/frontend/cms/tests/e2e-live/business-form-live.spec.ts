import { expect, test, type Page } from '@playwright/test'
import { ActivityPage } from '../e2e/pages/activity.page'
import { LoginPage } from '../e2e/pages/login.page'

/**
 * 业务表单真实提交闭环（e2e-live）：
 * 创建含 BusinessForm 的页面 → 审核发布 → 访客在 CRS 发布页提交
 * → 后端落库 → CMS 线索列表可见，且扩展字段经 remark JSON 展示在备注列。
 *
 * 建页/审核/发布走真实接口（page.request），访客提交与线索查看走 UI，
 * 保证「表单 → submitLead → leads 表 → CMS」这条主链路被端到端验证。
 */

const BACKEND = 'http://127.0.0.1:3300'
const CRS_ORIGIN = 'http://127.0.0.1:3010'

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page)
  await login.login('admin', 'admin123456')
  await page.waitForURL(/\/activity/, { timeout: 15000 })
}

test.describe.serial('业务表单真实提交闭环（发布页 → 提交 → 线索）', () => {
  let pageId: number | null = null
  const pageName = `E2E_业务表单_${Date.now()}`
  const visitorName = `E2E表单访客_${Date.now()}`
  const appointmentDate = '2026-10-20'

  const businessPageSchema = {
    version: '2.0.0',
    pageConfig: {
      name: pageName,
      scene: 'form',
      shareDesc: '在线登记办理信息',
      shareImage: '',
      backgroundColor: '#f8fafc',
      backgroundImage: '',
      backgroundPosition: 'top',
      cover: ''
    },
    componentMap: {
      intro: {
        id: 'intro',
        type: 'RichText',
        parentId: null,
        children: [],
        props: { content: '<h2>服务申请</h2><p>填写信息后提交申请，工作人员会及时跟进。</p>' },
        styles: {}
      },
      form: {
        id: 'form',
        type: 'BusinessForm',
        parentId: null,
        children: [],
        props: {
          title: '业务信息登记',
          subtitle: '请填写申请信息',
          submitText: '提交申请',
          fields: [
            { key: 'name', label: '姓名', type: 'text', required: true },
            { key: 'phone', label: '联系电话', type: 'text', required: true },
            { key: 'date', label: '预约日期', type: 'date', required: true }
          ]
        },
        styles: {}
      }
    },
    rootIds: ['intro', 'form']
  }

  test('1) 创建含业务表单的页面并审核发布', async ({ page }) => {
    await loginAsAdmin(page)
    const token = await page.evaluate(() => localStorage.getItem('token'))
    const headers = { Authorization: `Bearer ${token}` }

    const createResp = await page.request.post(`${BACKEND}/atlas-cms/addPageJson`, {
      headers,
      data: { name: pageName, schema: businessPageSchema }
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

  test('2) 访客在 CRS 发布页提交业务表单', async ({ page }) => {
    expect(pageId).not.toBeNull()

    // 访客视角：公开接口能读到已发布页
    const pub = await page.request.get(`${BACKEND}/atlas-cms/getPublishedPage?id=${pageId}`)
    const pubBody = await pub.json()
    expect(pubBody.code).toBe(10000)
    expect(pubBody.data?.publishedVersionId).toBeTruthy()

    await page.goto(`${CRS_ORIGIN}/crs/#/page?id=${pageId}`)
    const form = page.locator('.business-form-block')
    await expect(form).toBeVisible({ timeout: 15000 })

    await form.locator('.field-control').nth(0).fill(visitorName)
    await form.locator('.field-control').nth(1).fill('13812345678')
    await form.locator('.field-control').nth(2).fill(appointmentDate)
    await form.locator('input[type="checkbox"]').check()
    await form.locator('.submit-button').click()

    await expect(form.locator('.form-message.success')).toBeVisible({ timeout: 15000 })
  })

  test('3) CMS 线索列表可见新线索且备注含扩展字段', async ({ page }) => {
    expect(pageId).not.toBeNull()
    await loginAsAdmin(page)
    const activity = new ActivityPage(page)
    await activity.searchByName(pageName)
    const row = activity.getTableRows().first()
    await expect(row).toContainText(pageName, { timeout: 10000 })

    await row.getByRole('button').filter({ hasText: /线索/ }).first().click()
    const drawer = page.locator('.el-drawer').filter({ hasText: /线索列表/ })
    await expect(drawer).toBeVisible({ timeout: 10000 })

    await expect(drawer).toContainText(visitorName, { timeout: 10000 })
    await expect(drawer).toContainText('13812345678')
    // 扩展字段（预约日期）经 remark JSON 落库后展示在备注列
    await expect(drawer).toContainText('预约日期', { timeout: 10000 })
    await expect(drawer).toContainText(appointmentDate)
  })
})
