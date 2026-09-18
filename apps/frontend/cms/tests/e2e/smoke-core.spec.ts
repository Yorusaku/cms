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

    // 预览经 window.open 在新标签页打开（TopHeader.openPreview），当前页不会跳转，
    // 因此只等待 popup 事件即可；不要回退到对当前页 waitForURL（那条路径不可能命中，
    // 反而会在冷启动/并发负载下把「popup 来得慢」误判为失败）。
    // 冷启动时发布链路（预检 + 多个 mock 接口 + Vite 编译 Preview 模块）可能超过 8s，
    // 这里放宽到 20s，给后续断言留足余量。
    const popupPromise = page.context().waitForEvent("page", { timeout: 20000 });
    await decoratePage.clickPreview();

    const previewPageRaw = await popupPromise;
    await previewPageRaw.waitForLoadState("domcontentloaded");
    await expect(previewPageRaw).toHaveURL(/\/preview\?id=1/);

    const previewPage = new PreviewPage(previewPageRaw);
    await previewPage.expectIframeVisible();
    await previewPageRaw.close();
  });

  test("5) 回滚恢复", async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);

    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();

    // Action 14 起：回滚只切换线上版本，不覆盖草稿、不跳转装修页
    await activityPage.clickRollbackInDrawer();
    await activityPage.confirmRollbackIfNeeded();

    await expect(
      page.locator(".el-message--success").filter({ hasText: /线上页面已回滚/ }),
    ).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/activity/);
  });
});
