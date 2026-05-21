import { expect, type Page } from "@playwright/test";

export class PreviewPage {
  constructor(readonly page: Page) {}

  async goto(pageId: number) {
    await this.page.goto(`/cms-manage/preview?id=${pageId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async expectIframeVisible() {
    await expect(this.page.locator("iframe")).toBeVisible({ timeout: 5000 });
  }

  async selectDevice(deviceLabel: string) {
    await this.page.getByText(deviceLabel).first().click();
  }

  async expectFrameWidth(expectedWidth: number) {
    const wrapper = this.page.locator(".preview-page");
    const box = await wrapper.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(Math.round(box.width)).toBeGreaterThanOrEqual(expectedWidth - 20);
    }
  }

  async clickRefresh() {
    await this.page
      .getByRole("button")
      .filter({ hasText: /刷新|重试|refresh/i })
      .first()
      .click();
  }
}
