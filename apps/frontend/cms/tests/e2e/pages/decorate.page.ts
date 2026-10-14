import { expect, type Page } from "@playwright/test";

export class DecoratePage {
  constructor(readonly page: Page) {}

  async goto(pageId?: number) {
    const url = pageId ? `/cms-manage/decorate?id=${pageId}` : "/cms-manage/decorate";
    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");
  }

  async expectPanelsVisible() {
    await expect(this.page.getByText(/组件列表/i).first()).toBeVisible();
    await expect(this.page.getByText(/页面画布/i).first()).toBeVisible();
    await expect(this.page.getByText(/页面配置/i).first()).toBeVisible();
  }

  async expectCanvasHasComponentsAtLeast(count: number) {
    const items = this.page.locator(".canvas-dropzone .canvas-component");
    await expect
      .poll(async () => items.count(), { timeout: 10000 })
      .toBeGreaterThanOrEqual(count);
  }

  async clickComponent(index: number) {
    const items = this.page.locator(".canvas-dropzone .canvas-component");
    await items.nth(index).click();
  }

  async expectRightPanelVisible() {
    await expect(this.page.locator(".page-right").first()).toBeVisible();
  }

  async clickSaveDraft() {
    await this.page
      .getByRole("button")
      .filter({ hasText: /保存草稿|保存|save/i })
      .first()
      .click();
  }

  /**
   * 装修页「提交审核」。
   * Action 20 起装修页不再直接发布（原「发布」按钮已改为「提交审核」），
   * 发布必须由管理员在活动页执行，因此这里用精确名称匹配，避免误点到「发布记录」。
   */
  async clickSubmitReview() {
    await this.page
      .getByRole("button", { name: "提交审核", exact: true })
      .first()
      .click();
  }

  async clickPreview() {
    await this.page
      .getByRole("button")
      .filter({ hasText: /预览|preview/i })
      .first()
      .click();
  }

  async expectSuccessMessage() {
    await expect(this.page.locator(".el-message--success").first()).toBeVisible({
      timeout: 3000,
    });
  }
}
