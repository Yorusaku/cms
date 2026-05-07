import { test } from "@playwright/test";
import { PreviewPage } from "./pages/preview.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Preview", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
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
    // iPhone SE width is 320px
    await previewPage.expectFrameWidth(320);
  });

  test("refresh button reloads the preview", async ({ page }) => {
    const previewPage = new PreviewPage(page);
    await previewPage.goto(1);
    await previewPage.clickRefresh();
    await previewPage.expectIframeVisible();
  });
});
