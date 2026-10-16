import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { PreviewPage } from "./pages/preview.page";

test.describe("Preview", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("preview page loads with iframe", async ({ page }) => {
    const previewPage = new PreviewPage(page);
    await previewPage.goto(1);
    await previewPage.expectIframeVisible();
  });

  test("device selector changes frame width", async ({ page }) => {
    const previewPage = new PreviewPage(page);
    await previewPage.goto(1);
    await previewPage.selectDevice("iPhone SE");
    await previewPage.expectFrameWidth(320);
  });

  test("refresh button reloads the preview", async ({ page }) => {
    const previewPage = new PreviewPage(page);
    await previewPage.goto(1);
    await previewPage.clickRefresh();
    await previewPage.expectIframeVisible();
  });

  /**
   * 修复回归：Preview 页此前不发送任何消息，iframe 永远停在「页面内容为空」。
   * 现在预览页拉取页面草稿并经 SYNC_SCHEMA 推送给 CRS，需渲染出真实内容。
   */
  test("preview iframe renders synced schema via postMessage", async ({ page }) => {
    const previewPage = new PreviewPage(page);
    await previewPage.goto(1);

    const frame = page.frameLocator("#previewIframe");
    await expect(frame.locator(".page-preview-container")).toBeVisible({
      timeout: 10000,
    });
    // 空态文案消失 = 消息送达且渲染成功
    await expect(frame.getByText("页面内容为空")).toHaveCount(0, {
      timeout: 10000,
    });
    const bodyText = await frame.locator("body").innerText();
    expect(bodyText.trim().length).toBeGreaterThan(0);
  });

  /**
   * 编辑器内实时预览：画布「预览页面」按钮打开抽屉，PreviewIframe 订阅 store
   * （含未保存改动）实时同步到 CRS。
   */
  test("decorate live preview drawer renders current schema", async ({ page }) => {
    await page.goto("/cms-manage/decorate?id=1");
    await expect(
      page.getByText(/组件列表/).first(),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: "预览页面" }).first().click();
    const drawer = page.locator(".el-drawer").filter({ hasText: "实时预览" });
    await expect(drawer).toBeVisible({ timeout: 5000 });

    const frame = page.frameLocator(".el-drawer iframe.preview-iframe");
    await expect(frame.locator(".page-preview-container")).toBeVisible({
      timeout: 10000,
    });
    await expect(frame.getByText("页面内容为空")).toHaveCount(0, {
      timeout: 10000,
    });
  });
});
