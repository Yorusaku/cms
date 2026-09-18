import { expect, test, type Page } from '@playwright/test'
import { ActivityPage } from '../e2e/pages/activity.page'
import { LoginPage } from '../e2e/pages/login.page'

/**
 * CRS 渲染端（e2e-live）：
 * 1) CMS 预览流：活动页「预览」→ 新 tab 打开 Preview.vue → 正向断言 iframe HTTP 200 且渲染出 .page-preview-container。
 *    修复说明（F3）：buildPreviewUrl() 使用 VITE_CRS_PREVIEW_URL（http://127.0.0.1:3010/crs/#/pagePreview）再追加 ?id=。
 * 2) CRS 访客直连已发布页：正向断言 #/page?id=<id> 渲染出真实内容（F2：Page.vue 已注册 /page 路由）。
 */

const BACKEND = 'http://127.0.0.1:3300'
const CRS_ORIGIN = 'http://127.0.0.1:3010'

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page)
  await login.login('admin', 'admin123456')
  await page.waitForURL(/\/activity/, { timeout: 15000 })
}

/** 通过公开接口找一个已发布的 seed 页 id（不依赖业务库状态） */
async function findPublishedPageId(
  request: import('@playwright/test').APIRequestContext
): Promise<number | null> {
  for (let id = 1; id <= 10; id += 1) {
    const res = await request.get(`${BACKEND}/atlas-cms/getPublishedPage?id=${id}`)
    if (!res.ok()) continue
    const body = (await res.json()) as { code?: number }
    if (body.code === 10000) return id
  }
  return null
}

test.describe.serial('CRS 渲染端（CMS 预览 iframe + 访客直连）', () => {
  test('CMS 预览流：新 tab 打开 Preview，正向断言 iframe 200 且渲染 .page-preview-container', async ({
    page,
    context
  }) => {
    await loginAsAdmin(page)
    const activity = new ActivityPage(page)
    await activity.searchByName('618 年中大促')
    const row = activity.getTableRows().first()
    await expect(row).toContainText('618 年中大促', { timeout: 10000 })

    const popupPromise = context.waitForEvent('page', { timeout: 10000 }).catch(() => null)
    await row.getByRole('button').filter({ hasText: /预览/ }).first().click()
    const previewTab = await popupPromise
    expect(previewTab).not.toBeNull()
    if (!previewTab) return

    const seen: { url: string; status: number }[] = []
    previewTab.on('response', res => {
      if (res.url().includes(':3010')) {
        seen.push({ url: res.url(), status: res.status() })
      }
    })

    await previewTab.waitForLoadState('domcontentloaded')
    await expect(previewTab).toHaveURL(/\/preview\?id=\d+/, { timeout: 10000 })

    const iframe = previewTab.locator('iframe#previewIframe')
    await expect(iframe).toBeVisible({ timeout: 10000 })
    const src = await iframe.getAttribute('src')
    // F3 修复后：iframe 指向 CRS 预览页（VITE_CRS_PREVIEW_URL 带 /crs/#/pagePreview）
    expect(src).toMatch(/127\.0\.0\.1:3010\/crs\/#\/pagePreview\?id=\d+/)

    // 正向断言：iframe 内 CRS 渲染出 .page-preview-container（HTTP 200 由响应监听兜底）
    const frame = previewTab.frameLocator('iframe#previewIframe')
    await expect(frame.locator('.page-preview-container')).toBeVisible({
      timeout: 15000
    })

    // HTTP 200 正向断言：捕获到 :3010 的 200 响应
    const hasOk = seen.some(r => r.status === 200 && r.url.includes('/crs/'))
    expect(hasOk).toBeTruthy()
    test.info().annotations.push({
      type: 'preview-iframe',
      description: `iframe src = ${src}`
    })

    await previewTab.close()
  })
  test('访客直连已发布页：正向断言 #/page?id= 渲染真实内容', async ({ page, request }) => {
    const publishedId = await findPublishedPageId(request)
    expect(publishedId).not.toBeNull()

    // F2 修复后：/page 路由已注册，直接打开 hash 路由访问已发布页
    const url = `${CRS_ORIGIN}/crs/#/page?id=${publishedId}`
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)

    // 等待页面数据加载完成，SchemaRenderer 渲染出 .page-content（非 loading/error 态）
    await expect(page.locator('.page-content')).toBeVisible({ timeout: 10000 })
    // seed 演示页已含真实组件（F5），rootIds 渲染出组件节点（非空态）
    await expect(page.locator('.page-content .page-components > *').first()).toBeVisible({
      timeout: 10000
    })
    await expect(page.locator('.page-content .page-components > *').first()).not.toContainText(
      '页面内容为空'
    )
  })
})
