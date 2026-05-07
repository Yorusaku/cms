import { test } from "@playwright/test";
import { ActivityPage } from "./pages/activity.page";
import { DecoratePage } from "./pages/decorate.page";
import { setupApiMocks } from "./fixtures/api-mocks.setup";
import { mockToken } from "./fixtures/api-mocks";

test.describe("Publish & Rollback", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.evaluate((t) => localStorage.setItem("token", t), mockToken);
  });

  test("publishing from editor shows success", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    await decoratePage.clickPublish();
  });

  test("viewing publish logs opens drawer", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();
  });

  test("rolling back from activity page redirects to editor", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickPublishLogs(0);
    await activityPage.expectDrawerVisible();
    await activityPage.clickRollbackInDrawer();

    // After rollback, should redirect to decorate with rollbackVersionId
    await page.waitForURL("**/decorate**", { timeout: 5000 });
  });

  test("toggling online from activity list submits api call", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await activityPage.clickToggleOnline(0);
  });
});
