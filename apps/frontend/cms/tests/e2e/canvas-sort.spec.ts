import { expect, test, type Page } from '@playwright/test'
import type { IPageSchemaV2 } from '@cms/types'
import { mockPageDetailResponse, mockToken, successResponse } from './fixtures/api-mocks'
import { setAuthToken, setupApiMocks } from './fixtures/api-mocks.setup'

const originalOrder = ['stat-a', 'stat-b', 'stat-c']

function makeSchema(): IPageSchemaV2 {
  return {
    version: '2.0.0',
    pageConfig: { name: '鼠标排序验收', backgroundColor: '#eff6ff' },
    rootIds: [...originalOrder],
    componentMap: Object.fromEntries(originalOrder.map((id, index) => [id, {
      id, type: 'StatCard', parentId: null, children: [],
      props: { title: `排序指标${index + 1}`, value: String(index), description: '原始说明' },
      styles: {}
    }]))
  }
}

async function dragLastToFirst(page: Page) {
  const items = page.locator('.canvas-dropzone .canvas-component')
  const last = items.nth(2)
  await last.hover()
  const handle = await last.locator('.component-drag-handle').boundingBox()
  const target = await items.first().boundingBox()
  if (!handle || !target) throw new Error('无法定位排序手柄或目标')
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, handle.y + handle.height / 2, { steps: 12 })
  // Sortable 有 220ms 换位动画，逐个经过目标并等待 DOM 换位，避免在动画中越过下一项。
  const middle = await items.nth(1).boundingBox()
  if (!middle) throw new Error('无法定位中间组件')
  await page.mouse.move(target.x + target.width / 2, middle.y + 5, { steps: 12 })
  await expect(items.nth(1)).toContainText('排序指标3')
  await page.waitForTimeout(250)
  await page.mouse.move(target.x + target.width / 2, target.y + 5, { steps: 12 })
  await expect(items.first()).toContainText('排序指标3')
  await page.mouse.up()
}

test('鼠标排序 → 单次撤销重做 → 保存重进 → CRS 顺序一致', async ({ page }) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1600, height: 1100 })
  await setupApiMocks(page)
  let saved = makeSchema()
  await page.route(/\/api\/atlas-cms\/getPageJson/, route =>
    route.fulfill({ json: successResponse({ ...mockPageDetailResponse(2), schema: saved }) }))
  await page.route(/\/api\/atlas-cms\/updateCmsJson$/, async route => {
    saved = route.request().postDataJSON().schema
    await route.fulfill({ json: successResponse({ id: 2 }) })
  })
  await setAuthToken(page, mockToken)
  await page.goto('/cms-manage/decorate?id=2')
  const titles = page.locator('.canvas-component .stat-content p')
  await expect(titles).toHaveText(['排序指标1', '排序指标2', '排序指标3'])
  await page.locator('.canvas-component').first().click()
  await page.locator('.page-right .field-item').filter({ hasText: '辅助说明' }).locator('input').fill('排序前人工编辑')
  await expect(page.locator('.canvas-component').first()).toContainText('排序前人工编辑')
  await page.evaluate(() => {
    const events: unknown[] = []
    ;(window as unknown as { dragEvents: unknown[] }).dragEvents = events
    for (const type of ['dragstart', 'dragover', 'drop', 'dragend', 'update', 'end']) {
      document.addEventListener(type, event => {
        const drag = event as DragEvent
        if (events.length < 100) events.push({
          type, target: (event.target as HTMLElement)?.className,
          prevented: event.defaultPrevented, allowed: drag.dataTransfer?.effectAllowed,
          effect: drag.dataTransfer?.dropEffect,
          old: (event as unknown as { oldDraggableIndex: number }).oldDraggableIndex,
          next: (event as unknown as { newDraggableIndex: number }).newDraggableIndex
        })
      })
    }
  })
  await dragLastToFirst(page)
  await expect(titles).toHaveText(['排序指标3', '排序指标1', '排序指标2'])
  const events = await page.evaluate(() => (window as unknown as {
    dragEvents: Array<{ type: string; allowed?: string; effect?: string }>
  }).dragEvents)
  expect(events.some(event => event.type === 'dragstart' && event.allowed === 'move')).toBe(true)
  expect(events.some(event => event.type === 'dragover' && event.effect === 'copy')).toBe(false)
  await expect(page.locator('.canvas-component.active')).toContainText('排序指标1')
  await page.getByRole('button', { name: '撤销' }).click()
  await expect(titles).toHaveText(['排序指标1', '排序指标2', '排序指标3'])
  await expect(page.locator('.canvas-component').first()).toContainText('排序前人工编辑')
  await page.getByRole('button', { name: '重做' }).click()
  await expect(titles).toHaveText(['排序指标3', '排序指标1', '排序指标2'])
  await page.getByRole('button', { name: '保存草稿' }).click()
  await expect.poll(() => saved.rootIds).toEqual(['stat-c', 'stat-a', 'stat-b'])
  await page.reload()
  await expect(titles).toHaveText(['排序指标3', '排序指标1', '排序指标2'])
  await page.locator('.canvas-component').first().click()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(titles).toHaveText(['排序指标1', '排序指标3', '排序指标2'])
  await page.getByRole('button', { name: '撤销' }).click()
  await expect(titles).toHaveText(['排序指标3', '排序指标1', '排序指标2'])
  await page.screenshot({ path: '../../../tmp/acceptance/canvas-sort-editor.png', fullPage: true })
  await page.goto('/cms-manage/preview?id=2')
  const preview = page.frameLocator('#previewIframe')
  await expect(preview.locator('.stat-content p')).toHaveText(['排序指标3', '排序指标1', '排序指标2'])
  await expect(preview.locator('.stat-card-block').nth(1)).toContainText('排序前人工编辑')
  await page.screenshot({ path: '../../../tmp/acceptance/canvas-sort-preview.png', fullPage: true })
})

test('左侧真实鼠标拖入表单 → 字段区 Ctrl 多选 → 保存重进', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1100 })
  await setupApiMocks(page)
  let saved = makeSchema()
  saved.rootIds = ['stat-a']
  saved.componentMap = { 'stat-a': saved.componentMap['stat-a'] }
  await page.route(/\/api\/atlas-cms\/getPageJson/, route =>
    route.fulfill({ json: successResponse({ ...mockPageDetailResponse(2), schema: saved }) }))
  await page.route(/\/api\/atlas-cms\/updateCmsJson$/, async route => {
    saved = route.request().postDataJSON().schema
    await route.fulfill({ json: successResponse({ id: 2 }) })
  })
  await setAuthToken(page, mockToken)
  await page.goto('/cms-manage/decorate?id=2')
  await expect(page.locator('.canvas-component')).toHaveCount(1)
  const material = page.locator('.component-sidebar li').filter({ hasText: '信息采集表单' })
  await material.dragTo(page.locator('.canvas-dropzone'), { targetPosition: { x: 100, y: 400 } })
  await expect(page.locator('.canvas-component')).toHaveCount(2)
  const form = page.locator('.canvas-component').filter({ has: page.locator('.business-form-block') })
  await page.locator('.canvas-component').first().click()
  await form.locator('label').first().click({ modifiers: ['Control'] })
  await expect(page.locator('.canvas-component.selected')).toHaveCount(2)
  await form.locator('label').first().click({ modifiers: ['Control'] })
  await expect(page.locator('.canvas-component.selected')).toHaveCount(1)
  await form.locator('label').first().click()
  await expect(form).toHaveClass(/active/)
  await page.getByRole('button', { name: 'AI 更新内容' }).click()
  await expect(page.locator('.el-dialog').filter({ hasText: 'AI 更新内容' })).toContainText('信息采集表单')
  await page.getByRole('button', { name: '取消', exact: true }).click()
  await page.getByRole('button', { name: '保存草稿' }).click()
  await expect.poll(() => saved.rootIds.length).toBe(2)
  expect(saved.componentMap[saved.rootIds[1]].type).toBe('BusinessForm')
  await page.reload()
  await expect(page.locator('.canvas-component')).toHaveCount(2)
})
