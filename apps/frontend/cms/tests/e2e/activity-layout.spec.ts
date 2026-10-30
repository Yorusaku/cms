import { expect, test } from "@playwright/test";
import { mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";
import { ActivityPage } from "./pages/activity.page";

/**
 * 业务页面列表布局与操作收纳（mock 数据覆盖 published / pending_review / approved / draft）。
 *
 * 除元素存在性外，重点断言：
 * - 操作列为固定宽度且行内单行，不靠缩小字号硬塞；
 * - 常规桌面宽度下整页不横向溢出；
 * - 状态对应行内主动作与「更多」菜单收纳结果符合既有权限分支。
 */
test.describe("业务页面列表布局", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupApiMocks(page);
    await setAuthToken(page, mockToken);
  });

  test("行内操作单行且按状态给出主动作，低频操作收进更多菜单", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await expect(activityPage.getTableRows().first()).toBeVisible({ timeout: 10000 });

    const rows = activityPage.getTableRows();
    const actionsOf = async (index: number) =>
      (await rows.nth(index).locator(".row-actions").innerText()).replace(/\s+/g, " ").trim();

    // mock 数据：0-5 published / 6 pending_review / 7 approved / 8-9 draft
    expect(await actionsOf(0)).toBe("编辑 预览 更多");
    expect(await actionsOf(6)).toBe("编辑 预览 通过审核 更多");
    expect(await actionsOf(7)).toBe("编辑 预览 发布 更多");
    expect(await actionsOf(8)).toBe("编辑 预览 提交审核 更多");

    // 操作列宽度固定，且不再占掉半张表
    const actionHeaderWidth = await page
      .locator(".el-table__header th")
      .last()
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect(actionHeaderWidth).toBeLessThanOrEqual(240);

    // 行内单行：同一行所有操作子元素的顶部坐标一致
    const lineCounts = await page.locator(".row-actions").evaluateAll((els) =>
      els.map((el) => {
        const tops = Array.from(el.children).map((child) =>
          Math.round(child.getBoundingClientRect().top),
        );
        return new Set(tops).size;
      }),
    );
    expect(lineCounts.every((count) => count === 1)).toBe(true);

    // 整页不横向溢出（表格内部可滚，但不撑破页面）
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);

    // 时间列：YYYY-MM-DD HH:mm，且不出现 Invalid Date
    const timeCells = await rows.nth(0).locator("td").nth(4).innerText();
    expect(timeCells.trim()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
    const tableText = await page.locator(".el-table").innerText();
    expect(tableText).not.toContain("Invalid Date");
  });

  test("更多菜单收纳低频操作，删除为危险色且菜单不被裁切", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await expect(activityPage.getTableRows().first()).toBeVisible({ timeout: 10000 });

    // 已发布行：菜单里应包含复制/线索/发布记录/优化建议/上线/删除，但不出现重复的流程动作
    await activityPage.openRowMoreMenu(0);
    const menu = page.locator(".activity-more-menu:visible").last();
    const items = (await menu.locator(".el-dropdown-menu__item").allInnerTexts()).map((text) =>
      text.trim(),
    );
    // mock 第 1 行 isAbled=1（已上线），因此菜单里是「下线」
    expect(items).toEqual(["复制", "线索", "发布记录", "优化建议", "下线", "删除"]);
    expect(items).not.toContain("发布");
    expect(items).not.toContain("回滚到最新发布");

    // 菜单完整落在视口内，且宽度足以显示四个中文字
    const box = await menu.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual((viewport?.width ?? 0) + 1);
    expect(box!.width).toBeGreaterThanOrEqual(100);

    // 删除项为危险色
    const dangerColor = await menu
      .locator(".el-dropdown-menu__item")
      .filter({ hasText: "删除" })
      .evaluate((el) => getComputedStyle(el).color);
    expect(dangerColor).toContain("245");
  });

  test("待审核行：驳回进菜单，通过审核留在行内（不重复暴露）", async ({ page }) => {
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await expect(activityPage.getTableRows().first()).toBeVisible({ timeout: 10000 });

    // 单独用例只打开一次菜单：菜单浮层会覆盖下方行，避免在同一用例里切换行
    await activityPage.openRowMoreMenu(6);
    const pendingMenu = page.locator(".activity-more-menu:visible").last();
    const pendingItems = (await pendingMenu.locator(".el-dropdown-menu__item").allInnerTexts()).map(
      (text) => text.trim(),
    );
    expect(pendingItems).toContain("驳回");
    expect(pendingItems).not.toContain("通过审核");
  });

  test("1280 宽度下操作列保持单行且页面不横向溢出", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const activityPage = new ActivityPage(page);
    await activityPage.goto();
    await expect(activityPage.getTableRows().first()).toBeVisible({ timeout: 10000 });

    const metrics = await page.evaluate(() => {
      const docEl = document.documentElement;
      const rowActions = Array.from(document.querySelectorAll(".row-actions"));
      return {
        pageOverflow: docEl.scrollWidth - docEl.clientWidth,
        maxActionHeight: rowActions.length
          ? Math.max(...rowActions.map((el) => el.getBoundingClientRect().height))
          : 0,
        lineCounts: rowActions.map((el) => {
          const tops = Array.from(el.children).map((child) =>
            Math.round(child.getBoundingClientRect().top),
          );
          return new Set(tops).size;
        }),
      };
    });

    expect(metrics.pageOverflow).toBeLessThanOrEqual(0);
    expect(metrics.lineCounts.every((count) => count === 1)).toBe(true);
    // 单行高度：约 20px 上下，明显小于换行后的两行
    expect(metrics.maxActionHeight).toBeLessThan(32);

    // 筛选控件不被压扁（两个状态下拉都要能显示完整文案）
    const filterWidths = await page
      .locator(".filter-form .filter-control-status")
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().width)));
    expect(filterWidths.length).toBe(2);
    expect(filterWidths.every((width) => width >= 160)).toBe(true);
  });
});
