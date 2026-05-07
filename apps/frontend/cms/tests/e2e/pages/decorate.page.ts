import type { Page } from "@playwright/test";

export class DecoratePage {
  constructor(readonly page: Page) {}

  async goto(pageId?: number) {
    const url = pageId ? `/decorate?id=${pageId}` : "/decorate";
    await this.page.goto(url);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
  }

  async expectPanelsVisible() {
    // Left material panel
    await expect(this.page.locator(".left-material")).toBeVisible();
    // Center canvas
    await expect(this.page.locator(".canvas-area")).toBeVisible();
    // Right config panel
    await expect(this.page.locator(".right-config")).toBeVisible();
  }

  async expectCanvasHasComponents(count: number) {
    const items = this.page.locator(".canvas-component");
    await expect(items).toHaveCount(count);
  }

  async clickComponent(index: number) {
    const items = this.page.locator(".canvas-component");
    await items.nth(index).click();
    await this.page.waitForTimeout(200);
  }

  async expectRightPanelVisible() {
    await expect(this.page.locator(".right-config")).toBeVisible();
  }

  async clickSaveDraft() {
    const header = this.page.locator(".top-header");
    await header.getByRole("button", { name: /保存|保存草稿/i }).click();
    await this.page.waitForTimeout(300);
  }

  async clickPublish() {
    const header = this.page.locator(".top-header");
    await header.getByRole("button", { name: /发布/i }).click();
    await this.page.waitForTimeout(300);
  }

  async expectSuccessMessage() {
    await expect(this.page.locator(".el-message--success")).toBeVisible({ timeout: 3000 });
  }
}
