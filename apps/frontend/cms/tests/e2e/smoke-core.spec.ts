import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { ActivityPage } from "./pages/activity.page";
import { DecoratePage } from "./pages/decorate.page";
import { LoginPage } from "./pages/login.page";
import { PreviewPage } from "./pages/preview.page";

test.describe.serial("Core Smoke", () => {
  test("1) 登录", async ({ page }) => {
    await setupApiMocks(page);
    const loginPage = new LoginPage(page);
    await loginPage.login("admin", "admin123456");
    await page.waitForURL("**/activity**", { timeout: 5000 });
    await expect(page).toHaveURL(/\/activity/);
  });

  test("2) 模板建页（最小链路）", async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);

    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickCreatePage();
    const skipButton = page.locator(".el-dialog__footer .el-button").first();
    await expect(skipButton).toBeVisible({ timeout: 5000 });
    await skipButton.click();
    await page.waitForURL("**/decorate**", { timeout: 8000 });
    await expect(page).toHaveURL(/\/decorate/);
  });

  test("3) 编辑保存草稿", async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);

    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.expectPanelsVisible();
    await decoratePage.clickSaveDraft();
    await decoratePage.expectSuccessMessage();
  });

  test("4) 发布并预览", async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);

    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);

    const popupPromise = page.context().waitForEvent("page", { timeout: 8000 }).catch(() => null);
    await decoratePage.clickPreview();

    const previewPageRaw = await popupPromise;
    if (previewPageRaw) {
      await previewPageRaw.waitForLoadState("domcontentloaded");
      await expect(previewPageRaw).toHaveURL(/\/preview\?id=1/);

      const previewPage = new PreviewPage(previewPageRaw);
      await previewPage.expectIframeVisible();
      await previewPageRaw.close();
      return;
    }

    await page.waitForURL(/\/preview\?id=1/, { timeout: 8000 });
    const previewPage = new PreviewPage(page);
    await previewPage.expectIframeVisible();
  });

  test("5) 回滚恢复", async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);

    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();

    const decoratePopupPromise = page.context().waitForEvent("page", { timeout: 8000 }).catch(() => null);
    await activityPage.clickRollbackInDrawer();
    await activityPage.confirmRollbackIfNeeded();

    const decoratePageRaw = await decoratePopupPromise;
    if (decoratePageRaw) {
      await decoratePageRaw.waitForLoadState("domcontentloaded");
      await expect(decoratePageRaw).toHaveURL(/\/decorate/);
      await decoratePageRaw.close();
      return;
    }

    await page.waitForURL(/\/decorate/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/decorate/);
  });
});
