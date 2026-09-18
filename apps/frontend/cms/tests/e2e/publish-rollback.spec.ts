import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { ActivityPage } from "./pages/activity.page";
import { DecoratePage } from "./pages/decorate.page";

test.describe("Publish & Rollback", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("publishing from editor shows success", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickPublish();
    await decoratePage.expectSuccessMessage();
  });

  test("viewing publish logs opens drawer", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();
  });

  test("rolling back from activity page stays on page and shows success", async ({ page }) => {
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
