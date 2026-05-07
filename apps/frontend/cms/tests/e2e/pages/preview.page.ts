import type { Page } from "@playwright/test";

export class PreviewPage {
  constructor(readonly page: Page) {}

  async goto(pageId: number) {
    await this.page.goto(`/preview?id=${pageId}`);
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(500);
  }

  async expectIframeVisible() {
    await expect(this.page.locator("iframe")).toBeVisible({ timeout: 5000 });
  }

  async selectDevice(deviceLabel: string) {
    await this.page.getByText(deviceLabel).click();
    await this.page.waitForTimeout(300);
  }

  async expectFrameWidth(expectedWidth: number) {
    const wrapper = this.page.locator(".preview-device-wrapper");
    const box = await wrapper.boundingBox();
    if (box) {
      expect(Math.round(box.width)).toBe(expectedWidth);
    }
  }

  async clickRefresh() {
    await this.page.getByRole("button", { name: /刷新/i }).click();
    await this.page.waitForTimeout(300);
  }
}
