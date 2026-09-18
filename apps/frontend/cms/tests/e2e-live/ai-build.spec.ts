import { expect, test, type Page } from '@playwright/test'
import { ActivityPage } from '../e2e/pages/activity.page'
import { DecoratePage } from '../e2e/pages/decorate.page'
import { LoginPage } from '../e2e/pages/login.page'

/**
 * AI 一句话建页（e2e-live）：
 * 登录 → 「AI 新建」→ 填描述（标题/人群/优惠，按钮文案有默认值）→ 生成草稿（后端 AI_MOCK_ENABLED=true 走本地 mock）
 * → 断言进入 /decorate?id=<新id> 且草稿已保存（AI 接口内部 addPageJson），AI 生成的组件已进入 store。
 *
 * 修复说明（docs/E2E-FINDINGS.md F1–F5 已修复）：F1 后画布通过 VueDraggable 默认插槽真实渲染组件 DOM，
 * 因此此处直接断言画布出现 .canvas-component（升级替代物料计数间接断言）。
 */

const pageName = `E2E_AI_${Date.now()}`

async function loginAsAdmin(page: Page) {
  const login = new LoginPage(page)
  await login.login('admin', 'admin123456')
  await page.waitForURL(/\/activity/, { timeout: 15000 })
}

test.describe.serial('AI 一句话建页（本地 mock）', () => {
  test('通过 AI 新建生成草稿并进入装修页', async ({ page }) => {
    await loginAsAdmin(page)
    const activity = new ActivityPage(page)

    // 打开 AI 新建弹窗
    await page
      .getByRole('button')
      .filter({ hasText: /AI 新建/ })
      .first()
      .click()
    const dialog = page.locator('.el-dialog').filter({ hasText: /AI 新建活动页/ })
    await expect(dialog).toBeVisible({ timeout: 10000 })

    // 填写必填描述字段
    await dialog.getByPlaceholder('如：618 爆款限时购').fill(pageName)
    await dialog.getByPlaceholder('如：25-35 岁新锐白领').fill('18-30 岁学生党')
    await dialog
      .getByPlaceholder('如：满 299 减 80，前 100 名加赠礼包')
      .fill('全场 8 折，前 50 名加赠礼包')
    // 按钮文案/活动类型/页面风格均有默认值，无需填写

    // 提交生成
    await dialog
      .getByRole('button')
      .filter({ hasText: /生成草稿/ })
      .first()
      .click()

    // 生成成功 → 跳转装修页并出现 success 或 warning 提示（mock 可能带 warnings）
    await page.waitForURL(/\/decorate\?id=\d+/, { timeout: 30000 })
    await expect(page.locator('.el-message').first()).toBeVisible({
      timeout: 10000
    })

    const decorate = new DecoratePage(page)
    await decorate.expectPanelsVisible()

    // 断言进入的是新 AI 页面：页面名称已加载（来自后端返回的 schema）
    await expect(page.getByPlaceholder('请输入页面名称')).toHaveValue(pageName, {
      timeout: 10000
    })

    // 断言 AI 生成的组件已进入 store：物料列表中至少有一个组件计数 > 0
    // （如轮播图 1/50 等，来自 AI mock 生成的 Carousel/RichText/Notice/Product/LeadForm/FloatLayer）
    const materialCounts = await page.locator('.component-list li').allInnerTexts()
    const hasUsedComponents = materialCounts.some(text => /[1-9]\d*\//.test(text))
    expect(hasUsedComponents).toBeTruthy()

    // F1 修复后：画布真实渲染出 AI 生成的组件 DOM（升级替代物料计数间接断言）
    await expect(page.locator('.canvas-dropzone .canvas-component')).not.toHaveCount(0, {
      timeout: 5000
    })

    // 回到活动列表搜索确认草稿行存在
    const match = page.url().match(/id=(\d+)/)
    const aiPageId = match ? Number(match[1]) : null
    expect(aiPageId).not.toBeNull()

    await page.goto('/cms-manage/activity')
    await activity.searchByName(pageName)
    await expect(activity.getTableRows().first()).toContainText(pageName, {
      timeout: 10000
    })
  })
})
