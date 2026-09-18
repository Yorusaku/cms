import { expect, test, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { ActivityPage } from '../e2e/pages/activity.page'
import { DecoratePage } from '../e2e/pages/decorate.page'
import { LoginPage } from '../e2e/pages/login.page'

/**
 * 真实链路全流程（e2e-live）：
 * 登录 → 模板建页 → 编辑(填名/拖组件) → 保存草稿 → 发布 → 访客公开接口留资(submitLead)
 * → 后台线索查看(渠道/UTM) → 发布记录 → 回滚 → CRS 访客直连已发布页（正向断言）。
 * 数据源：backend(3300) + 独立测试库 cms_platform_resume_e2e（globalSetup 每次重建 + seed）。
 *
 * 修复说明（docs/E2E-FINDINGS.md F1–F5 已修复）：
 * - F1 装修画布：CenterCanvas 改用 VueDraggable 默认插槽 + v-for，画布真实渲染组件 DOM（.canvas-component）。
 * - F2 CRS 访客直连：Page.vue 已注册 /page 路由，可直接打开 #/page?id=<id> 渲染已发布页。
 * - F3 CMS 预览 iframe：buildPreviewUrl 使用 VITE_CRS_PREVIEW_URL（127.0.0.1:3010/crs/#/pagePreview）。
 * - F4 CRS 首页真实列表：Home.vue 请求 getPublishedPageList 展示已上线页。
 * - F5 seed 演示页：为 8 个演示页填充真实组件 schema。
 */

const BACKEND = 'http://127.0.0.1:3300'
const CRS_ORIGIN = 'http://127.0.0.1:3010'

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page)
  await login.login('admin', 'admin123456')
  await page.waitForURL(/\/activity/, { timeout: 15000 })
}

test.describe.serial('真实链路全流程（登录→建页→编辑→发布→留资→线索→回滚）', () => {
  let pageId: number | null = null
  const pageName = `E2E_全流程_${Date.now()}`

  test('1) 登录 admin，seed 演示页可见', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page).toHaveURL(/\/activity/)

    const activity = new ActivityPage(page)
    await activity.searchByName('618 年中大促')
    await expect(activity.getTableRows().first()).toContainText('618 年中大促', {
      timeout: 10000
    })
  })

  test('2) 新增页面 → 跳过模板 → 进入装修画布', async ({ page }) => {
    await loginAsAdmin(page)
    const activity = new ActivityPage(page)
    await activity.clickCreatePage()

    const skipBtn = page
      .locator('.el-dialog__footer .el-button')
      .filter({ hasText: /跳过，创建空白页/ })
      .first()
    await expect(skipBtn).toBeVisible({ timeout: 10000 })
    await skipBtn.click()

    await page.waitForURL(/\/decorate/, { timeout: 10000 })
    const decorate = new DecoratePage(page)
    await decorate.expectPanelsVisible()
  })

  test('3) 编辑：填页面名称 + 拖入辅助线 + 保存草稿', async ({ page }) => {
    await loginAsAdmin(page)
    const decorate = new DecoratePage(page)
    await decorate.goto()
    await decorate.expectPanelsVisible()

    // 页面名称（右侧 SetPageInfo）
    const nameInput = page.getByPlaceholder('请输入页面名称')
    await expect(nameInput).toBeVisible({ timeout: 10000 })
    await nameInput.fill(pageName)

    // 拖入「辅助线」（AssistLine 是最低配可发布组件，preflight 可通过）。
    // 说明：Playwright 的 dragTo 用鼠标事件，不触发原生 HTML5 DnD；LeftMaterial 的
    // onDragstart 不读 dataTransfer，直接写 store，故用 dispatchEvent 派发原生事件：
    //   dragstart -> LeftMaterial.onDragstart（写 dragComponent）
    //   dragover/drop -> CenterCanvas.handleDragOver/handleDrop（读 store 加组件）
    // F1 修复后：画布通过 VueDraggable 默认插槽渲染组件，同时用物料计数 0/50 -> 1/50 与画布 DOM 双重断言。
    const material = page
      .locator('.component-list li')
      .filter({ hasText: /辅助线/ })
      .first()
    await expect(material).toBeVisible()
    await material.hover()
    const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
    await material.dispatchEvent('dragstart', { dataTransfer })
    await page.locator('.canvas-dropzone').dispatchEvent('dragover', { dataTransfer })
    await page.locator('.canvas-dropzone').dispatchEvent('drop', { dataTransfer })
    await expect(material).toContainText('1/50', { timeout: 5000 })
    // 正向断言：画布真实渲染出组件 DOM（F1 修复后 VueDraggable 默认插槽生效）
    await expect(page.locator('.canvas-dropzone .canvas-component')).toHaveCount(1, {
      timeout: 5000
    })

    // 保存草稿 → 成功后跳转 /decorate?id=<新id>
    await decorate.clickSaveDraft()
    await expect(
      page.locator('.el-message--success').filter({ hasText: /草稿保存成功/ })
    ).toBeVisible({ timeout: 10000 })
    await page.waitForURL(/\/decorate\?id=\d+/, { timeout: 10000 })

    const match = page.url().match(/id=(\d+)/)
    pageId = match ? Number(match[1]) : null
    expect(pageId).not.toBeNull()
  })

  test('4) 发布页面', async ({ page }) => {
    expect(pageId).not.toBeNull()
    await loginAsAdmin(page)
    const decorate = new DecoratePage(page)
    await decorate.goto(pageId!)
    await decorate.expectPanelsVisible()

    await decorate.clickPublish()
    await expect(page.locator('.el-message--success').filter({ hasText: /发布成功/ })).toBeVisible({
      timeout: 10000
    })
  })

  test('5) 访客公开接口：读取已发布页 + 提交留资(submitLead)', async ({ page }) => {
    expect(pageId).not.toBeNull()

    const pub = await page.request.get(`${BACKEND}/atlas-cms/getPublishedPage?id=${pageId}`)
    expect(pub.ok()).toBeTruthy()
    const pubBody = await pub.json()
    expect(pubBody.code).toBe(10000)
    const publishedVersionId = pubBody.data?.publishedVersionId as string
    expect(publishedVersionId).toBeTruthy()

    const lead = await page.request.post(`${BACKEND}/atlas-cms/submitLead`, {
      data: {
        requestId: randomUUID(),
        name: 'E2E留资',
        phoneNumber: '13812345678',
        pageId: Number(pageId),
        publishedVersionId,
        sessionId: `e2e-${Date.now()}`,
        utm: { source: 'e2e', medium: 'test' },
        channel: { source: 'e2e' }
      }
    })
    const leadBody = await lead.json()
    expect(leadBody.code).toBe(10000)
    expect(leadBody.data).toHaveProperty('id')
  })

  test('6) 后台该页面查看线索（姓名/手机号/渠道 UTM）', async ({ page }) => {
    await loginAsAdmin(page)
    const activity = new ActivityPage(page)
    await activity.searchByName(pageName)
    const row = activity.getTableRows().first()
    await expect(row).toContainText(pageName, { timeout: 10000 })

    await row.getByRole('button').filter({ hasText: /线索/ }).first().click()
    const drawer = page.locator('.el-drawer').filter({ hasText: /线索列表/ })
    await expect(drawer).toBeVisible({ timeout: 10000 })

    await expect(drawer).toContainText('E2E留资', { timeout: 10000 })
    await expect(drawer).toContainText('13812345678')
    await expect(drawer).toContainText('source=e2e')
  })

  test('7) 发布记录 → 回滚 → 成功提示 + 出现回滚日志', async ({ page }) => {
    await loginAsAdmin(page)
    const activity = new ActivityPage(page)
    await activity.searchByName(pageName)
    const row = activity.getTableRows().first()
    await expect(row).toContainText(pageName, { timeout: 10000 })

    // 打开发布记录
    await activity.clickPublishLogs(0)
    await activity.expectDrawerVisible()
    const drawer = page.locator('.el-drawer').filter({ hasText: /发布记录/ })
    await expect(drawer.locator('.log-card').first()).toBeVisible({
      timeout: 10000
    })

    // 回滚到最新发布版本
    await drawer
      .getByRole('button')
      .filter({ hasText: /回滚到此版本/ })
      .first()
      .click()
    await expect(page.locator('.el-message-box').filter({ hasText: /确认回滚/ })).toBeVisible({
      timeout: 5000
    })
    await page
      .locator('.el-message-box')
      .getByRole('button')
      .filter({ hasText: /确认回滚/ })
      .first()
      .click()

    // 回滚成功提示
    await expect(
      page.locator('.el-message--success').filter({ hasText: /线上页面已回滚/ })
    ).toBeVisible({ timeout: 10000 })

    // 关闭并重开发布记录，断言出现「回滚至 ...」日志（rollback 日志已写入）
    await page.keyboard.press('Escape')
    await activity.clickPublishLogs(0)
    await activity.expectDrawerVisible()
    const drawer2 = page.locator('.el-drawer').filter({ hasText: /发布记录/ })
    await expect(drawer2.getByText(/回滚至/).first()).toBeVisible({
      timeout: 10000
    })
  })

  test('8) CRS 访客直连已发布页（正向断言渲染真实内容）', async ({ page }) => {
    expect(pageId).not.toBeNull()
    // F2 修复后：/page 路由已注册，直接打开 hash 路由访问已发布页
    const url = `${CRS_ORIGIN}/crs/#/page?id=${pageId}`
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    // 等待页面数据加载完成，SchemaRenderer 渲染出 .page-content（非 loading/error 态）
    await expect(page.locator('.page-content')).toBeVisible({ timeout: 10000 })
    // 页面已发布且含组件，rootIds 渲染出真实组件节点（非空态）
    await expect(page.locator('.page-content .page-components > *').first()).toBeVisible({
      timeout: 10000
    })
    await expect(page.locator('.page-content .page-components > *').first()).not.toContainText(
      '页面内容为空'
    )
  })
})
