import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setupApiMocks, setAuthToken } from "./fixtures/api-mocks.setup";
import { DecoratePage } from "./pages/decorate.page";

test("业务物料可在编辑器中使用并进入预览链路", async ({ page }) => {
  test.setTimeout(60000);
  await setupApiMocks(page);
  await setAuthToken(page, mockToken);

  const decoratePage = new DecoratePage(page);
  await decoratePage.goto(1);

  await expect(page.getByText("业务组件", { exact: true })).toBeVisible();
  await expect(page.getByText("信息采集表单", { exact: true })).toBeVisible();
  await expect(page.getByText("业务数据列表", { exact: true })).toBeVisible();
  await expect(page.getByText("统计卡片", { exact: true })).toBeVisible();

  await decoratePage.clickSaveDraft();
  await decoratePage.expectSuccessMessage();

  const popupPromise = page.context().waitForEvent("page", { timeout: 20000 });
  await decoratePage.clickPreview();
  const previewPage = await popupPromise;
  await previewPage.waitForLoadState("domcontentloaded");
  await expect(previewPage).toHaveURL(/\/preview\?id=1/);
  await expect(previewPage.locator("iframe")).toBeVisible();
  await previewPage.close();
});
