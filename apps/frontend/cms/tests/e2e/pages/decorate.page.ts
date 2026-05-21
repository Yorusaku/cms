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
    const items = this.page.locator(".canvas-component");
    await expect(items).toHaveCount(count);
  }

  async clickComponent(index: number) {
    const items = this.page.locator(".canvas-component");
    await items.nth(index).click();
  }

  async expectRightPanelVisible() {
    await expect(this.page.locator(".right-config")).toBeVisible();
  }

  async clickSaveDraft() {
    await this.page
      .getByRole("button")
      .filter({ hasText: /保存草稿|保存|save/i })
      .first()
      .click();
  }

  async clickPublish() {
    await this.page
      .getByRole("button")
      .filter({ hasText: /发布|publish/i })
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
