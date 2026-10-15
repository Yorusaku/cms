import { expect, test } from "@playwright/test";

/**
 * 业务表单真实提交闭环（mock 套件）：
 * CRS 发布页渲染 BusinessForm → 填写 → 勾选隐私 → 提交
 * → 拦截 submitLead 校验请求体 → 显示提交成功。
 *
 * 说明：
 * - CRS 的 .env 把 VITE_API_BASE_URL 指向 http://127.0.0.1:3300，
 *   请求 URL 不带 /api 前缀，因此这里用宽松 pattern 自行打桩，
 *   不复用 setupApiMocks（其 pattern 带 /api，匹配不到 CRS 的请求）。
 * - getPublishedPage 是公开接口，mock 套件默认不覆盖，需单独桩。
 */

const CRS_ORIGIN = "http://127.0.0.1:3010";

const publishedPageResponse = {
  code: 10000,
  message: "success",
  data: {
    id: 1,
    name: "业务信息登记页",
    publishedVersionId: "1-v1",
    schema: {
      version: "2.0.0",
      pageConfig: { name: "业务信息登记页" },
      componentMap: {
        form: {
          id: "form",
          type: "BusinessForm",
          props: {
            title: "业务信息登记",
            subtitle: "请填写以下信息",
            submitText: "提交信息",
            fields: [
              { key: "name", label: "姓名", type: "text", required: true },
              { key: "phone", label: "联系电话", type: "text", required: true },
              { key: "date", label: "预约日期", type: "date" },
              {
                key: "bizType",
                label: "业务类型",
                type: "select",
                options: ["咨询", "办理"],
              },
            ],
          },
          parentId: null,
          children: [],
        },
      },
      rootIds: ["form"],
    },
  },
};

test("业务表单提交进入线索链路（CRS 发布页 → submitLead）", async ({ page }) => {
  test.setTimeout(60000);

  // CRS 请求不带 /api 前缀（VITE_API_BASE_URL 指向 3300），用宽松 pattern
  await page.route(/atlas-cms\/getPublishedPage/, async (route) => {
    await route.fulfill({ json: publishedPageResponse });
  });

  await page.route(/atlas-cms\/trackEvent/, async (route) => {
    await route.fulfill({ json: { code: 10000, message: "success", data: {} } });
  });

  // 后注册的同名 handler 会覆盖默认桩，用于捕获请求体
  const submitRequests: Array<Record<string, unknown>> = [];
  await page.route(/atlas-cms\/submitLead$/, async (route) => {
    submitRequests.push(JSON.parse(route.request().postData() || "{}"));
    await route.fulfill({
      json: { code: 10000, message: "success", data: { id: 1, duplicated: false } },
    });
  });

  await page.goto(`${CRS_ORIGIN}/crs/#/page?id=1`);

  const form = page.locator(".business-form-block");
  await expect(form).toBeVisible({ timeout: 20000 });

  // 填写姓名、手机号、日期、下拉
  await form.locator(".field-control").nth(0).fill("张三");
  await form.locator(".field-control").nth(1).fill("13800138000");
  await form.locator(".field-control").nth(2).fill("2026-10-20");
  await form.locator("select").selectOption("咨询");

  // 勾选隐私政策后提交
  await form.locator('input[type="checkbox"]').check();
  await form.locator(".submit-button").click();

  await expect(form.locator(".form-message.success")).toBeVisible({ timeout: 15000 });

  // 校验请求体：字段映射、页面上下文、幂等与营销参数
  expect(submitRequests).toHaveLength(1);
  const body = submitRequests[0];
  expect(body.name).toBe("张三");
  expect(body.phoneNumber).toBe("13800138000");
  expect(body.pageId).toBe(1);
  expect(body.consentAccepted).toBe(true);
  expect(typeof body.requestId).toBe("string");
  expect(typeof body.sessionId).toBe("string");
  expect(JSON.parse(body.remark as string)).toEqual({
    预约日期: "2026-10-20",
    业务类型: "咨询",
  });
});
