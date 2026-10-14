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

  test("submitting review from editor shows success", async ({ page }) => {
    const decoratePage = new DecoratePage(page);
    await decoratePage.goto(1);
    // Action 20 起装修页只提交审核，发布由管理员在活动页执行
    await decoratePage.clickSubmitReview();
    await expect(
      page.locator(".el-message--success").filter({ hasText: /已提交审核/ }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("admin approves and publishes a pending page from activity list", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();

    // mock 数据：第 7 行为 pending_review，第 8 行为 approved
    await activityPage.approveRow(6);
    await expect(
      page.locator(".el-message--success").filter({ hasText: /审核通过/ }),
    ).toBeVisible({ timeout: 8000 });

    await activityPage.publishRow(7);
    await expect(
      page.locator(".el-message--success").filter({ hasText: /发布成功/ }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("viewer 只读：看不到审核与发布入口", async ({ page }) => {
    await setAuthToken(page, mockToken, "viewer");
    const activityPage = new ActivityPage(page);
    await activityPage.goto();

    await expect(activityPage.getTableRows().first()).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("button", { name: "通过审核", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "发布", exact: true }),
    ).toHaveCount(0);
    await expect(page.getByText(/观察员账号/).first()).toBeVisible();
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
