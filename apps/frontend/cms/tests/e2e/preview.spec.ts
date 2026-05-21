import { test } from "@playwright/test";
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
});
