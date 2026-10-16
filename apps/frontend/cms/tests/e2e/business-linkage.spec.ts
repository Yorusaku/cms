import { expect, test } from "@playwright/test";

/**
 * 业务查询页联动闭环（mock 套件）：
 * CRS 渲染带 linkages 的查询页 → 输入关键词 → 列表结果变化 → 统计卡片同步。
 *
 * 说明：
 * - CRS 的 .env 把 VITE_API_BASE_URL 指向 http://127.0.0.1:3300，
 *   请求 URL 不带 /api 前缀，因此用宽松 pattern 自行打桩；
 * - getPublishedPage 是公开接口，mock 套件默认不覆盖，需单独桩。
 */

const CRS_ORIGIN = "http://127.0.0.1:3010";

const businessRows = [
  { id: 1, name: "服务申请", status: "处理中" },
  { id: 2, name: "资料补交", status: "已完成" },
  { id: 3, name: "预约办理", status: "处理中" },
  { id: 4, name: "服务评价", status: "已完成" },
  { id: 5, name: "资料审核", status: "已驳回" },
  { id: 6, name: "服务续期", status: "处理中" },
];

const publishedPageResponse = {
  code: 10000,
  message: "success",
  data: {
    id: 2,
    name: "业务查询页",
    publishedVersionId: "2-v1",
    schema: {
      version: "2.0.0",
      pageConfig: { name: "业务查询页", scene: "list" },
      componentMap: {
        stat: {
          id: "stat",
          type: "StatCard",
          parentId: null,
          children: [],
          props: {
            title: "匹配记录数",
            value: businessRows.length,
            description: "随筛选实时变化",
            icon: "数",
          },
        },
        list: {
          id: "list",
          type: "BusinessList",
          parentId: null,
          children: [],
          props: {
            title: "办理记录",
            subtitle: "输入关键词筛选，上方统计同步变化",
            columns: [
              { key: "name", label: "事项" },
              { key: "status", label: "状态" },
            ],
            rows: businessRows,
            pageSize: 5,
          },
        },
      },
      rootIds: ["stat", "list"],
      linkages: [
        {
          id: "linkage-filtered-count",
          sourceComponentId: "list",
          targetComponentId: "stat",
          sourceProperty: "filteredCount",
          targetProperty: "value",
          enabled: true,
        },
      ],
    },
  },
};

test("业务查询页：关键词筛选联动统计卡片", async ({ page }) => {
  test.setTimeout(60000);

  await page.route(/atlas-cms\/getPublishedPage/, async (route) => {
    await route.fulfill({ json: publishedPageResponse });
  });
  await page.route(/atlas-cms\/trackEvent/, async (route) => {
    await route.fulfill({ json: { code: 10000, message: "success", data: {} } });
  });

  await page.goto(`${CRS_ORIGIN}/crs/#/page?id=2`);

  const list = page.locator(".business-list-block");
  const statValue = page.locator(".stat-card-block .stat-content strong");

  await expect(list).toBeVisible({ timeout: 20000 });
  // 初始即为全部记录数
  await expect(statValue).toHaveText(String(businessRows.length));

  // 关键词命中 2 条（资料补交 / 资料审核）：列表与统计同步变化
  await list.locator(".search-input").fill("资料");
  await expect(list.locator("tbody tr")).toHaveCount(2, { timeout: 5000 });
  await expect(statValue).toHaveText("2", { timeout: 5000 });
});

test("业务查询页：无匹配时列表空态且统计归零", async ({ page }) => {
  test.setTimeout(60000);

  await page.route(/atlas-cms\/getPublishedPage/, async (route) => {
    await route.fulfill({ json: publishedPageResponse });
  });
  await page.route(/atlas-cms\/trackEvent/, async (route) => {
    await route.fulfill({ json: { code: 10000, message: "success", data: {} } });
  });

  await page.goto(`${CRS_ORIGIN}/crs/#/page?id=2`);

  const list = page.locator(".business-list-block");
  const statValue = page.locator(".stat-card-block .stat-content strong");

  await expect(list).toBeVisible({ timeout: 20000 });

  await list.locator(".search-input").fill("不存在的关键词");
  await expect(list).toContainText("暂无数据", { timeout: 5000 });
  await expect(statValue).toHaveText("0", { timeout: 5000 });
});
