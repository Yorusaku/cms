import { expect, test } from '@playwright/test'
import type { IPageSchemaV2 } from '@cms/types'
import { mockPageDetailResponse, mockToken, successResponse } from './fixtures/api-mocks'
import { setAuthToken, setupApiMocks } from './fixtures/api-mocks.setup'

const origin = process.env.CRS_RUNTIME_ORIGIN || 'http://127.0.0.1:3010'
const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1sAAAAASUVORK5CYII='
const definitions = [
  { id: 'text', type: 'RichText', props: { content: '<p>设备使用说明</p>', padding: '8px', backgroundColor: '#ffffff' } },
  { id: 'notice', type: 'Notice', props: { noticeList: [{ text: '设备开放登记', link: '' }], backgroundColor: '#fff8e9' } },
  { id: 'form', type: 'BusinessForm', props: { title: '设备登记', fields: [{ key: 'name', label: '姓名', type: 'text', required: true }] } },
  { id: 'list', type: 'BusinessList', props: { title: '设备记录', rows: [{ id: 1, name: '设备A', status: '正常' }] } },
  { id: 'stat', type: 'StatCard', props: { title: '设备数', value: 0 } },
  { id: 'images', type: 'ImageNav', props: { list: [{ text: '设备入口', imageUrl: pixel }], columnPadding: 0, rowPadding: 0 } }
]
const schema: IPageSchemaV2 = {
  version: '2.0.0', pageConfig: { name: '运行时样式验收', backgroundColor: '#eff6ff' },
  rootIds: definitions.map(node => node.id),
  componentMap: Object.fromEntries(definitions.map(node => [node.id, {
    ...node, parentId: null, children: [],
    styles: node.id === 'stat' ? { marginTop: '9px', border: '3px solid rgb(220, 38, 38)' } : {}
  }]))
}

test('运行时遵循页面与物料样式，不添加编辑辅助边框或统一留白', async ({ page }) => {
  test.setTimeout(60000)
  await page.setViewportSize({ width: 375, height: 1000 })
  await page.route(/atlas-cms\/getPublishedPage/, route => route.fulfill({ json: successResponse({
    id: 2, schema, publishedVersionId: 'layout-v1', publishedAt: null
  }) }))
  await page.route(/atlas-cms\/trackEvent/, route => route.fulfill({ json: successResponse({}) }))
  await page.goto(`${origin}/crs/#/page?id=2`)
  const root = page.locator('.schema-renderer')
  await expect(root.locator('.nav-container img')).toBeVisible()
  await expect(root).toHaveCSS('background-color', 'rgb(239, 246, 255)')
  await expect(root.locator('.page-components')).toHaveCSS('padding-left', '0px')
  await expect(root.locator('.page-components')).toHaveCSS('row-gap', 'normal')
  for (const selector of ['.crs-rich-text', '.notice-bar', '.business-form-block', '.business-list-block', '.nav-container']) {
    await expect(root.locator(selector)).toHaveCSS('border-top-width', '0px')
  }
  const stat = root.locator('.stat-card-block')
  await expect(stat).toHaveCSS('border-top-width', '3px')
  await expect(stat).toHaveCSS('margin-top', '9px')
  await expect(stat.locator('strong')).toHaveText('0')
  const icon = root.locator('.notice-bar svg').first()
  await expect(icon).toHaveCSS('width', '16px')
  const formPadding = await root.locator('.business-form-block').evaluate(el => parseFloat(getComputedStyle(el).paddingTop))
  // px-to-viewport 保留三位小数，在 375px 下允许换算舍入误差。
  expect(formPadding).toBeCloseTo(20, 2)
  expect(await root.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true)
  const mode = process.env.CRS_RUNTIME_ORIGIN ? 'build' : 'dev'
  await page.screenshot({ path: `../../../tmp/acceptance/runtime-layout-${mode}.png`, fullPage: true })

  // 开发态同时验证 CMS 通过签名消息推送同一份 Schema 的真实预览入口。
  if (!process.env.CRS_RUNTIME_ORIGIN) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await setupApiMocks(page)
    await page.route(/\/api\/atlas-cms\/getPageJson/, route => route.fulfill({
      json: successResponse({ ...mockPageDetailResponse(2), schema })
    }))
    await setAuthToken(page, mockToken)
    await page.goto('/cms-manage/decorate?id=2')
    await expect(page.locator('.canvas-component')).toHaveCount(6)
    await page.screenshot({ path: '../../../tmp/acceptance/runtime-layout-editor.png', fullPage: true })
    await page.goto('/cms-manage/preview?id=2')
    const preview = page.frameLocator('#previewIframe')
    await expect(preview.locator('.business-form-block')).toBeVisible()
    await expect(preview.locator('.crs-rich-text')).toHaveCSS('border-top-width', '0px')
    await expect(preview.locator('.schema-renderer')).toHaveCSS('background-color', 'rgb(239, 246, 255)')
    await expect(preview.locator('.stat-card-block strong')).toHaveText('0')
    await page.screenshot({ path: '../../../tmp/acceptance/runtime-layout-preview.png', fullPage: true })
  }
})
