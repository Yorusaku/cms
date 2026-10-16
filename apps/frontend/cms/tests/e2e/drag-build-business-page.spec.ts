import { expect, test, type Page } from "@playwright/test";
import { mockPageDetailResponse, mockToken } from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";

/**
 * 业务页面低代码搭建——拖拽搭建核心链路。
 *
 * 验证用户真实操作路径：从物料面板拖入业务物料（HTML5 原生 drag 事件序列）→
 * 画布出现组件 → 右侧属性面板修改配置且画布实时生效 → 保存草稿 →
 * 打开预览 → CRS 渲染同一份 Schema。
 *
 * Schema 校验方式：通过拦截页面保存接口的请求体（addPageJson /
 * updateCmsJson）确认，不直接操作 Pinia store、不绕过 UI。
 */

interface CapturedComponent {
  type: string;
  props: Record<string, unknown>;
}

interface CapturedSchema {
  componentMap: Record<string, CapturedComponent>;
}

const readJsonBody = async (route: import("@playwright/test").Route) => {
  const postData = route.request().postData();
  if (!postData) {
    return {} as Record<string, unknown>;
  }
  try {
    return JSON.parse(postData) as Record<string, unknown>;
  } catch {
    return {} as Record<string, unknown>;
  }
};

/**
 * HTML5 原生拖拽：编辑器物料卡片绑定 @dragstart、画布 dropzone 绑定
 * @dragover/@drop（useDragDrop hook），Playwright 的 mouse API 不会触发
 * 浏览器拖拽管线，需按 W3C DnD 事件序列手动派发，并共享同一个
 * DataTransfer（组件内部会读写 dataTransfer 与 store）。
 */
async function dragMaterialToCanvas(page: Page, materialLabel: string) {
  const material = page
    .locator(".component-sidebar .component-list li")
    .filter({ hasText: materialLabel });
  await material.waitFor({ state: "visible" });

  const dropzone = page.locator(".canvas-dropzone");
  const beforeCount = await page
    .locator(".canvas-dropzone .canvas-component")
    .count();

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await material.dispatchEvent("dragstart", { dataTransfer });
  await dropzone.dispatchEvent("dragover", { dataTransfer });
  await dropzone.dispatchEvent("drop", { dataTransfer });
  await material.dispatchEvent("dragend", { dataTransfer });

  await expect(
    page.locator(".canvas-dropzone .canvas-component"),
  ).toHaveCount(beforeCount + 1, { timeout: 10000 });
}

test.describe("业务页面低代码搭建", () => {
  test("拖拽物料、配置属性并在 CRS 预览中渲染", async ({ page }) => {
    test.setTimeout(90000);
    await setupApiMocks(page);

    // 有状态桩：捕获保存请求体里的 Schema，并让预览页拉到同一份内容。
    // 「预览」按钮经 window.open 打开新标签页，page.route 对 popup 不生效；
    // 但 page.route 优先于 context.route，所以同一 handler 需要注册两级：
    // page 级覆盖 setupApiMocks 的同名通用桩（原页面保存/读取），
    // context 级兜底 popup 里的预览页请求。
    const savedSchemas = new Map<number, CapturedSchema>();
    const captureSchema = (body: Record<string, unknown>) => {
      const id = Number(body.id || 99);
      if (body.schema && typeof body.schema === "object") {
        savedSchemas.set(id, body.schema as CapturedSchema);
      }
    };
    const statefulJson = (data: unknown) => ({
      json: { code: 10000, message: "success", data },
    });

    const statefulRoutes: Array<{
      pattern: RegExp;
      handler: (route: import("@playwright/test").Route) => Promise<void>;
    }> = [
      {
        pattern: /\/api\/atlas-cms\/addPageJson$/,
        handler: async (route) => {
          captureSchema(await readJsonBody(route));
          await route.fulfill(statefulJson({ id: 99 }));
        },
      },
      {
        pattern: /\/api\/atlas-cms\/updateCmsJson$/,
        handler: async (route) => {
          captureSchema(await readJsonBody(route));
          await route.fulfill(statefulJson({ id: 99 }));
        },
      },
      {
        pattern: /\/api\/atlas-cms\/getPageJson/,
        handler: async (route) => {
          const id = Number(
            new URL(route.request().url()).searchParams.get("id") || "1",
          );
          const saved = savedSchemas.get(id);
          const detail = saved
            ? { ...mockPageDetailResponse(1), id, schema: saved }
            : mockPageDetailResponse(id);
          await route.fulfill(statefulJson(detail));
        },
      },
    ];
    for (const { pattern, handler } of statefulRoutes) {
      await page.route(pattern, handler);
      await page.context().route(pattern, handler);
    }

    await setAuthToken(page, mockToken);

    // 1. 打开装修编辑器（空白业务页面）
    await page.goto("/cms-manage/decorate");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(/组件列表/i).first()).toBeVisible();
    await expect(page.locator(".canvas-dropzone .canvas-component")).toHaveCount(0);

    // 2. 从物料面板拖入三个业务物料（真实拖拽事件序列）
    await dragMaterialToCanvas(page, "信息采集表单");
    await dragMaterialToCanvas(page, "业务数据列表");
    await dragMaterialToCanvas(page, "统计卡片");

    // 3. 画布中出现对应组件（物料组件真实渲染）
    const canvas = page.locator(".canvas-dropzone");
    await expect(canvas.locator(".business-form-block")).toBeVisible();
    await expect(canvas.locator(".business-list-block")).toBeVisible();
    await expect(canvas.locator(".stat-card-block")).toBeVisible();

    // 4. 选中统计卡片，右侧属性面板修改「指标标题」
    await canvas
      .locator(".canvas-component")
      .filter({ has: page.locator(".stat-card-block") })
      .click();
    const titleInput = page
      .locator(".page-right .field-item")
      .filter({ hasText: "指标标题" })
      .locator("input");
    await expect(titleInput).toBeVisible();
    await titleInput.fill("今日待办");

    // 4.1 配置值在画布中实时生效（配置 emit 有 200ms 防抖，expect 自动重试）
    await expect(canvas.locator(".stat-card-block")).toContainText("今日待办");

    // 5. 保存草稿
    await page.getByRole("button", { name: "保存草稿" }).click();
    await expect(page.locator(".el-message--success")).toContainText(
      "草稿保存成功",
    );
    // 新建保存后装修器跳转到带 id 的地址
    await page.waitForURL(/decorate\?id=99/, { timeout: 15000 });

    // 6. 通过保存接口请求体验证 Schema（不直接读 store）
    const savedSchema = savedSchemas.get(99);
    expect(savedSchema, "保存请求体应包含 Schema").toBeTruthy();
    const components = Object.values(savedSchema!.componentMap);
    expect(components.map((item) => item.type)).toEqual([
      "BusinessForm",
      "BusinessList",
      "StatCard",
    ]);
    const statCard = components.find((item) => item.type === "StatCard");
    expect(String(statCard?.props?.title)).toBe("今日待办");

    // 7. 打开预览——「预览」按钮经 window.open 在新标签页打开独立 CRS 预览页
    const popupPromise = page.context().waitForEvent("page");
    await page.getByRole("button", { name: "预览", exact: true }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");

    // 8. CRS 预览端渲染同一份 Schema，编辑端配置可见
    const previewFrame = popup.frameLocator("#previewIframe");
    await expect(popup).toHaveURL(/preview\?id=99/, { timeout: 15000 });
    await expect(previewFrame.locator(".stat-card-block")).toContainText(
      "今日待办",
      { timeout: 30000 },
    );
    await expect(previewFrame.locator(".business-form-block")).toBeVisible();
    await expect(previewFrame.locator(".business-list-block")).toBeVisible();
  });
});
