import { expect, test } from '@playwright/test'
import { mockToken } from './fixtures/api-mocks'
import { setupApiMocks, setAuthToken } from './fixtures/api-mocks.setup'

/**
 * 提交审核与发布前的业务检查（前端侧）。
 *
 * 规则来自 @cms/types 的 checkPageForSubmit，与后端同一份实现。
 * 这里验证三种模式的差异：
 * - 保存草稿不拦截；
 * - 预览只提醒，可以继续；
 * - 提交审核遇到阻断级问题即停止，并给出结构化问题面板。
 */
const ILLEGAL_SCHEMA = {
  version: '2.0.0',
  pageConfig: { name: '' },
  componentMap: {
    'form-1': {
      id: 'form-1',
      type: 'BusinessForm',
      parentId: null,
      children: [],
      props: {
        title: '设备报修登记',
        subtitle: '请填写报修信息',
        submitText: '提交',
        // 缺少手机号基础字段 → 阻断
        fields: [{ key: 'name', label: '姓名', type: 'text', required: true }]
      },
      styles: {}
    }
  },
  rootIds: ['form-1']
}

test.describe('提交审核业务检查', () => {
  test('不合法页面：保存草稿通过，提交审核被拦截并展示问题', async ({ page }) => {
    test.setTimeout(60000)
    await setupApiMocks(page)
    await setAuthToken(page, mockToken)

    let submitCalled = false
    await page.route(/\/api\/atlas-cms\/getPageJson/, async route => {
      await route.fulfill({
        json: {
          code: 10000,
          message: 'success',
          data: {
            id: 1,
            name: '未命名页面',
            status: 'draft',
            schema: ILLEGAL_SCHEMA
          }
        }
      })
    })
    await page.route(/\/api\/atlas-cms\/updateCmsJson/, async route => {
      await route.fulfill({
        json: { code: 10000, message: 'success', data: { id: 1 } }
      })
    })
    await page.route(/\/api\/atlas-cms\/submitReview/, async route => {
      submitCalled = true
      await route.fulfill({
        json: { code: 10000, message: 'success', data: null }
      })
    })

    await page.goto('/cms-manage/decorate?id=1')
    await page.waitForLoadState('networkidle').catch(() => undefined)

    // 1) 保存草稿：不做业务完整性拦截
    await page.getByRole('button', { name: '保存草稿' }).click()
    // 装修页会同时挂着「页面数据加载成功」，按文案过滤避免 strict mode 冲突
    await expect(
      page.locator('.el-message--success').filter({ hasText: '草稿保存成功' })
    ).toBeVisible({ timeout: 10000 })

    // 2) 提交审核：被同一份规则拦下，展示结构化问题
    await page.getByRole('button', { name: '提交审核' }).click()
    const dialog = page.locator('.page-check-dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog).toContainText('提交已拦截')
    await expect(dialog).toContainText('页面标题不能为空')
    await expect(dialog).toContainText('表单字段配置不合法')
    expect(submitCalled).toBe(false)
  })

  test('不合法页面：预览只提醒，可以继续', async ({ page }) => {
    test.setTimeout(60000)
    await setupApiMocks(page)
    await setAuthToken(page, mockToken)

    await page.route(/\/api\/atlas-cms\/getPageJson/, async route => {
      await route.fulfill({
        json: {
          code: 10000,
          message: 'success',
          data: {
            id: 1,
            name: '未命名页面',
            status: 'draft',
            schema: ILLEGAL_SCHEMA
          }
        }
      })
    })
    await page.route(/\/api\/atlas-cms\/updateCmsJson/, async route => {
      await route.fulfill({
        json: { code: 10000, message: 'success', data: { id: 1 } }
      })
    })

    await page.goto('/cms-manage/decorate?id=1')
    await page.waitForLoadState('networkidle').catch(() => undefined)

    const popupPromise = page.context().waitForEvent('page', { timeout: 20000 })
    await page.getByRole('button', { name: '预览', exact: true }).click()

    const dialog = page.locator('.page-check-dialog')
    await expect(dialog).toBeVisible({ timeout: 10000 })
    await expect(dialog).toContainText('页面存在需要确认的问题')

    // 预览模式允许继续：点「仍然预览」后打开预览页
    await dialog.getByRole('button', { name: '仍然预览' }).click()
    const previewPage = await popupPromise
    await previewPage.waitForLoadState('domcontentloaded')
    await expect(previewPage).toHaveURL(/\/preview\?id=1/)
    await previewPage.close()
  })
})
