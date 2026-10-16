import { expect, test, type Page } from '@playwright/test'
import { LoginPage } from '../e2e/pages/login.page'

/**
 * 拖拽搭建页面完整链路（e2e-live）：
 * 装修器空白页真实拖拽物料 → 保存落库 → 重新进入装修页验证回显并二次编辑
 * → 保存更新 → 提交审核 → 审核通过 → 发布 → CRS 正式发布页渲染最终内容。
 *
 * 拖拽为 HTML5 原生 DnD 事件序列（与 mock 套件 drag-build-business-page 一致），
 * 建页/审核/发布走真实接口，验证「拖拽产物可以被再次编辑并正常发布」。
 */

const BACKEND = 'http://127.0.0.1:3300'
const CRS_ORIGIN = 'http://127.0.0.1:3010'

const FIRST_TITLE = '拖拽链路验证'
const SECOND_TITLE = '发布版标题'

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page)
  await login.login('admin', 'admin123456')
  await page.waitForURL(/\/activity/, { timeout: 15000 })
}

/** HTML5 原生拖拽：与 mock 套件相同的 W3C DnD 事件序列 */
async function dragMaterialToCanvas(page: Page, materialLabel: string) {
  const material = page
    .locator('.component-sidebar .component-list li')
    .filter({ hasText: materialLabel })
  await material.waitFor({ state: 'visible' })

  const dropzone = page.locator('.canvas-dropzone')
  const beforeCount = await page
    .locator('.canvas-dropzone .canvas-component')
    .count()

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await material.dispatchEvent('dragstart', { dataTransfer })
  await dropzone.dispatchEvent('dragover', { dataTransfer })
  await dropzone.dispatchEvent('drop', { dataTransfer })
  await material.dispatchEvent('dragend', { dataTransfer })

  await expect(
    page.locator('.canvas-dropzone .canvas-component')
  ).toHaveCount(beforeCount + 1, { timeout: 10000 })
}

/** 清理本地草稿，避免「检测到未保存草稿」弹窗干扰重新进入装修页 */
async function clearLocalDrafts(page: Page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((key) => key.includes(':page:'))
      .forEach((key) => localStorage.removeItem(key))
  })
}

test.describe.serial('拖拽搭建页面完整链路（拖拽 → 再编辑 → 发布）', () => {
  let pageId: number | null = null
  const pageName = `E2E_拖拽搭建_${Date.now()}`

  test('1) 空白页拖拽搭建并保存落库', async ({ page }) => {
    await loginAsAdmin(page)
    await clearLocalDrafts(page)

    // 空白页（无 id）→ 拖入统计卡片 → 修改指标标题
    await page.goto('/cms-manage/decorate')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.canvas-dropzone .canvas-component')).toHaveCount(0)

    await dragMaterialToCanvas(page, '统计卡片')

    await page
      .locator('.canvas-component')
      .filter({ has: page.locator('.stat-card-block') })
      .click()
    const titleInput = page
      .locator('.page-right .field-item')
      .filter({ hasText: '指标标题' })
      .locator('input')
    await expect(titleInput).toBeVisible()
    await titleInput.fill(FIRST_TITLE)
    await expect(page.locator('.canvas-dropzone .stat-card-block')).toContainText(
      FIRST_TITLE
    )

    // 保存草稿（新建）→ 装修器跳转到带 id 地址
    await page.getByRole('button', { name: '保存草稿' }).click()
    await expect(page.locator('.el-message--success')).toContainText('草稿保存成功')
    await page.waitForURL(/decorate\?id=\d+/, { timeout: 15000 })

    const url = new URL(page.url())
    pageId = Number(url.searchParams.get('id'))
    expect(pageId).toBeGreaterThan(0)
  })

  test('2) 重新进入装修页回显数据并二次编辑', async ({ page }) => {
    expect(pageId).not.toBeNull()
    await loginAsAdmin(page)
    await clearLocalDrafts(page)

    await page.goto(`/cms-manage/decorate?id=${pageId}`)
    await page.waitForLoadState('networkidle')

    // 数据回显：拖入的组件与第一次的配置值都在
    const statCard = page.locator('.canvas-dropzone .stat-card-block')
    await expect(statCard).toBeVisible({ timeout: 15000 })
    await expect(statCard).toContainText(FIRST_TITLE)

    // 二次编辑：改指标标题再保存（走更新链路 updateCmsJson）
    await page
      .locator('.canvas-component')
      .filter({ has: page.locator('.stat-card-block') })
      .click()
    const titleInput = page
      .locator('.page-right .field-item')
      .filter({ hasText: '指标标题' })
      .locator('input')
    await expect(titleInput).toHaveValue(FIRST_TITLE)
    await titleInput.fill(SECOND_TITLE)
    await expect(page.locator('.canvas-dropzone .stat-card-block')).toContainText(
      SECOND_TITLE
    )

    await page.getByRole('button', { name: '保存草稿' }).click()
    await expect(
      page.locator('.el-message--success').filter({ hasText: '草稿保存成功' })
    ).toBeVisible({ timeout: 10000 })

    // 服务端确认二次编辑已落库
    const token = await page.evaluate(() => localStorage.getItem('token'))
    const detail = await page.request.get(
      `${BACKEND}/atlas-cms/getPageJson?id=${pageId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const body = await detail.json()
    expect(body.code).toBe(10000)
    const statProps = Object.values(body.data.schema.componentMap).find(
      (item: any) => item.type === 'StatCard'
    ) as any
    expect(String(statProps.props.title)).toBe(SECOND_TITLE)
  })

  test('3) 提交审核 → 审核通过 → 发布', async ({ page }) => {
    expect(pageId).not.toBeNull()
    await loginAsAdmin(page)
    const token = await page.evaluate(() => localStorage.getItem('token'))
    const headers = { Authorization: `Bearer ${token}` }

    // UI 提交审核（装修器顶部按钮）
    await page.goto(`/cms-manage/decorate?id=${pageId}`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('.canvas-dropzone .stat-card-block')).toBeVisible({
      timeout: 15000
    })
    await page.getByRole('button', { name: '提交审核', exact: true }).click()
    await expect(
      page
        .locator('.el-message--success')
        .filter({ hasText: /提交审核|审核/ })
        .first()
    ).toBeVisible({ timeout: 10000 })

    // 管理员审核通过 + 发布（真实接口）
    const approveResp = await page.request.post(`${BACKEND}/atlas-cms/reviewPage`, {
      headers,
      data: { pageId, decision: 'approved', note: '拖拽链路 e2e 审核通过' }
    })
    expect((await approveResp.json()).code).toBe(10000)

    const publishResp = await page.request.post(`${BACKEND}/atlas-cms/publishPage`, {
      headers,
      data: { pageId, note: '拖拽链路 e2e 发布' }
    })
    const publishBody = await publishResp.json()
    expect(publishBody.code).toBe(10000)
    expect(publishBody.data?.versionId).toBeTruthy()
  })

  test('4) CRS 正式发布页渲染拖拽搭建的最终内容', async ({ page }) => {
    expect(pageId).not.toBeNull()

    // 发布快照应包含二次编辑后的值
    const pub = await page.request.get(
      `${BACKEND}/atlas-cms/getPublishedPage?id=${pageId}`
    )
    const pubBody = await pub.json()
    expect(pubBody.code).toBe(10000)
    const statProps = Object.values(pubBody.data.schema.componentMap).find(
      (item: any) => item.type === 'StatCard'
    ) as any
    expect(String(statProps.props.title)).toBe(SECOND_TITLE)

    await page.goto(`${CRS_ORIGIN}/crs/#/page?id=${pageId}`)
    const statCard = page.locator('.stat-card-block')
    await expect(statCard).toBeVisible({ timeout: 15000 })
    await expect(statCard).toContainText(SECOND_TITLE)
  })
})
