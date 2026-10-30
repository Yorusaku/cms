import { expect, test } from "@playwright/test";
import {
  mockPageDetailResponse,
  mockToken,
  successResponse,
} from "./fixtures/api-mocks";
import { setAuthToken, setupApiMocks } from "./fixtures/api-mocks.setup";

/**
 * AI 内容更新（多选三类区块）完整链路：
 * 多选富文本 + 公告 + 业务表单 → 输入新资料 → 生成建议 → 取消勾选其中一个
 * → 应用选中修改 → 验证内容与保留属性 → 撤销 / 重做 → 保存草稿 →
 * 重新读取页面 → CRS 预览一致。
 *
 * AI 建议走页面级 route 桩（不调用真实模型），页面保存与读取使用有状态桩。
 */

const PAGE_ID = 2;

const contentSchema = {
  version: "2.0.0",
  pageConfig: { name: "AI 内容更新 E2E" },
  componentMap: {
    "rich-1": {
      id: "rich-1",
      type: "RichText",
      parentId: null,
      children: [],
      props: { content: "<p>旧的开班说明文字</p>" },
      styles: {},
    },
    "notice-1": {
      id: "notice-1",
      type: "Notice",
      parentId: null,
      children: [],
      props: { noticeList: [{ text: "旧公告一", link: "/detail/a" }] },
      styles: {},
    },
    "form-1": {
      id: "form-1",
      type: "BusinessForm",
      parentId: null,
      children: [],
      props: {
        title: "培训登记",
        subtitle: "请填写以下信息",
        submitText: "提交信息",
        fields: [
          { key: "name", label: "姓名", type: "text", required: true },
        ],
      },
      styles: {},
    },
  },
  rootIds: ["rich-1", "notice-1", "form-1"],
};

const aiSuggestionResponse = {
  code: 10000,
  message: "success",
  data: {
    source: "model",
    changes: [
      {
        componentId: "rich-1",
        type: "RichText",
        blocks: [{ type: "paragraph", text: "11 月 3 日开班的新说明" }],
        html: "<p>11 月 3 日开班的新说明</p>",
      },
      {
        componentId: "notice-1",
        type: "Notice",
        noticeTexts: ["11 月 3 日开班"],
      },
      {
        componentId: "form-1",
        type: "BusinessForm",
        title: "11 月培训登记",
      },
    ],
    warnings: [],
  },
};

type SavedSchema = typeof contentSchema;

test.describe("AI 内容更新（多选区块）", () => {
  test("多选三类区块 → 应用建议 → 撤销重做 → 保存 → CRS 预览一致", async ({
    page,
  }) => {
    test.setTimeout(120000);
    await setupApiMocks(page);

    // 有状态桩：本页返回三类内容组件；保存后更新；预览与重读读同一份
    const saved: { schema: SavedSchema } = {
      schema: contentSchema as SavedSchema,
    };

    await page.route(/\/api\/atlas-cms\/getPageJson/, async (route) => {
      const id = Number(
        new URL(route.request().url()).searchParams.get("id") || "1",
      );
      const detail = {
        ...mockPageDetailResponse(id),
        id,
        schema: id === PAGE_ID ? saved.schema : mockPageDetailResponse(id).schema,
      };
      await route.fulfill({ json: successResponse(detail) });
    });

    await page.route(/\/api\/atlas-cms\/updateCmsJson$/, async (route) => {
      const body = JSON.parse(route.request().postData() || "{}");
      if (body.schema && typeof body.schema === "object") {
        saved.schema = body.schema as SavedSchema;
      }
      await route.fulfill({ json: successResponse({ id: PAGE_ID }) });
    });

    await page.route(
      /\/api\/atlas-cms\/aiSuggestContentChanges$/,
      async (route) => {
        await route.fulfill({ json: aiSuggestionResponse });
      },
    );

    await setAuthToken(page, mockToken);
    await page.goto(`/cms-manage/decorate?id=${PAGE_ID}`);
    await page.waitForLoadState("networkidle");

    // 1. 画布出现三类组件
    const components = page.locator(".canvas-dropzone .canvas-component");
    await expect(components).toHaveCount(3, { timeout: 15000 });

    // 2. 多选三个区块（Ctrl + 点击）
    await components.nth(0).click();
    await components.nth(1).click({ modifiers: ["Control"] });
    await components.nth(2).click({ modifiers: ["Control"] });

    // 3. 打开 AI 更新内容弹窗
    await page.getByRole("button", { name: "AI 更新内容" }).click();
    const dialog = page
      .locator(".el-dialog")
      .filter({ hasText: "AI 更新内容" });
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("富文本");
    await expect(dialog).toContainText("信息采集表单");

    // 4. 输入资料并生成建议
    await dialog
      .locator("textarea")
      .fill("本期培训班改为 11 月 3 日开班，公告和说明同步更新");
    await dialog.getByRole("button", { name: "生成建议" }).click();

    const suggestions = dialog.locator(".ai-suggestion");
    await expect(suggestions).toHaveCount(3, { timeout: 10000 });
    // 对比内容：原内容与建议内容同时可见
    await expect(dialog).toContainText("旧的开班说明文字");
    await expect(dialog).toContainText("11 月 3 日开班的新说明");

    // 5. 取消勾选公告 → 只应用另外两个
    await suggestions.nth(1).locator(".el-checkbox").click();
    await expect(
      dialog.getByRole("button", { name: /应用选中修改（2）/ }),
    ).toBeEnabled();
    await dialog.getByRole("button", { name: /应用选中修改（2）/ }).click();
    await expect(dialog).toBeHidden({ timeout: 5000 });

    // 6. 应用结果：富文本与表单更新，公告保持原样（未勾选）
    const canvas = page.locator(".canvas-dropzone");
    await expect(canvas.locator(".crs-rich-text")).toContainText(
      "11 月 3 日开班的新说明",
    );
    await expect(canvas.locator(".business-form-block")).toContainText(
      "11 月培训登记",
    );
    await expect(canvas.locator(".notice-bar")).toContainText("旧公告一");
    // 表单其余属性保留
    await expect(canvas.locator(".business-form-block")).toContainText(
      "提交信息",
    );

    // 7. 撤销 → 恢复原内容；重做 → 变化回来
    await page.getByRole("button", { name: "撤销" }).click();
    await expect(canvas.locator(".crs-rich-text")).toContainText(
      "旧的开班说明文字",
    );
    await expect(canvas.locator(".business-form-block")).toContainText(
      "培训登记",
    );

    await page.getByRole("button", { name: "重做" }).click();
    await expect(canvas.locator(".crs-rich-text")).toContainText(
      "11 月 3 日开班的新说明",
    );

    // 8. 保存草稿 → 通过保存请求体校验 Schema
    await page.getByRole("button", { name: "保存草稿" }).click();
    await expect(
      page
        .locator(".el-message--success")
        .filter({ hasText: "草稿保存成功" }),
    ).toBeVisible({ timeout: 10000 });

    const noticeProps = saved.schema.componentMap["notice-1"]
      .props as Record<string, unknown>;
    const noticeList = noticeProps.noticeList as Array<{ text: string }>;
    expect(noticeList[0].text).toBe("旧公告一");
    const formProps = saved.schema.componentMap["form-1"].props as Record<
      string,
      unknown
    >;
    expect(String(formProps.title)).toBe("11 月培训登记");
    expect(String(formProps.submitText)).toBe("提交信息");

    // 9. 重新读取：重新进入装修页，保存的内容仍在
    await page.goto(`/cms-manage/decorate?id=${PAGE_ID}`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.locator(".canvas-dropzone .crs-rich-text"),
    ).toContainText("11 月 3 日开班的新说明", { timeout: 15000 });

    // 10. CRS 预览与保存内容一致
    await page.goto(`/cms-manage/preview?id=${PAGE_ID}`);
    const previewFrame = page.frameLocator("#previewIframe");
    await expect(previewFrame.locator(".crs-rich-text")).toContainText(
      "11 月 3 日开班的新说明",
      { timeout: 30000 },
    );
    await expect(previewFrame.locator(".business-form-block")).toContainText(
      "11 月培训登记",
    );
    await expect(previewFrame.locator(".notice-bar")).toContainText("旧公告一");
  });
});
