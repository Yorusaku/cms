import { BadRequestException, ServiceUnavailableException } from "@nestjs/common";
import type { AiSuggestContentChangesRequest } from "@cms/types";
import { AiService } from "../src/modules/ai/ai.service";
import type { AiSuggestContentChangesDto } from "../src/modules/ai/dto/ai-suggest-content-changes.dto";

/**
 * AI 内容更新建议（aiSuggestContentChanges）。
 *
 * 关注点：
 * 1. 三种物料（RichText / Notice / BusinessForm）的合法更新与受控富文本生成；
 * 2. 未知目标、重复目标、类型不匹配、越界字段、公告数量不一致 → 整次无效；
 * 3. 富文本中的标签 / 事件属性 / javascript: 不能成为可执行 HTML；
 * 4. 无实际变化时剔除建议；mock 来源明确；模型不可用且非 mock 时报明确错误。
 *
 * 说明：provider 通过 jest mock 注入，测试不调用真实模型。
 */
describe("AI 内容更新建议", () => {
  const suggestContentChanges = jest.fn();
  const isMockMode = jest.fn();

  const createService = () =>
    new AiService(
      {} as never,
      { suggestContentChanges, isMockMode } as never,
      {} as never,
    );

  const request: AiSuggestContentChangesRequest = {
    instruction: "本期培训班改为 11 月 3 日开班，公告和说明同步更新",
    targets: [
      {
        componentId: "rich-1",
        type: "RichText",
        content: "<p>旧的开班说明</p>",
      },
      {
        componentId: "notice-1",
        type: "Notice",
        noticeTexts: ["旧公告一", "旧公告二"],
      },
      {
        componentId: "form-1",
        type: "BusinessForm",
        title: "培训登记",
        subtitle: "请填写信息",
        submitText: "提交",
      },
    ],
  };

  const dtoOf = (value: unknown): AiSuggestContentChangesDto =>
    value as AiSuggestContentChangesDto;

  const modelDraft = (changes: unknown) => ({
    changes,
    warnings: [] as string[],
  });

  beforeEach(() => {
    suggestContentChanges.mockReset().mockResolvedValue(null);
    isMockMode.mockReset().mockReturnValue(false);
  });

  it("三类物料的合法更新：富文本生成受控 HTML，公告与表单字段原样返回", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        {
          componentId: "rich-1",
          type: "RichText",
          blocks: [
            { type: "heading", text: "培训安排" },
            { type: "paragraph", text: "11 月 3 日开班" },
            { type: "list", ordered: true, items: ["材料一", "材料二"] },
          ],
        },
        {
          componentId: "notice-1",
          type: "Notice",
          noticeTexts: ["11 月 3 日开班", "地点不变"],
        },
        {
          componentId: "form-1",
          type: "BusinessForm",
          title: "11 月培训登记",
          subtitle: "请填写报名信息",
        },
      ]),
    );

    const result = await createService().suggestContentChanges(dtoOf(request));

    expect(result.source).toBe("model");
    expect(result.changes).toHaveLength(3);

    const richChange = result.changes.find(
      (item) => item.componentId === "rich-1",
    );
    expect(richChange?.html).toBe(
      "<h3>培训安排</h3><p>11 月 3 日开班</p><ol><li>材料一</li><li>材料二</li></ol>",
    );

    const noticeChange = result.changes.find(
      (item) => item.componentId === "notice-1",
    );
    expect(noticeChange?.noticeTexts).toEqual(["11 月 3 日开班", "地点不变"]);

    const formChange = result.changes.find(
      (item) => item.componentId === "form-1",
    );
    expect(formChange?.title).toBe("11 月培训登记");
    expect(formChange?.subtitle).toBe("请填写报名信息");
    // 未返回的字段保持 undefined，由应用端保留原值
    expect(formChange?.submitText).toBeUndefined();
  });

  it("未知目标 ID → 整次无效", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        {
          componentId: "unknown-1",
          type: "RichText",
          blocks: [{ type: "paragraph", text: "新的内容" }],
        },
      ]),
    );

    await expect(
      createService().suggestContentChanges(dtoOf(request)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("重复目标 → 整次无效", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        {
          componentId: "rich-1",
          type: "RichText",
          blocks: [{ type: "paragraph", text: "第一次" }],
        },
        {
          componentId: "rich-1",
          type: "RichText",
          blocks: [{ type: "paragraph", text: "第二次" }],
        },
      ]),
    );

    await expect(
      createService().suggestContentChanges(dtoOf(request)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("变更类型与请求不一致 → 整次无效", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        { componentId: "rich-1", type: "Notice", noticeTexts: ["改公告"] },
      ]),
    );

    await expect(
      createService().suggestContentChanges(dtoOf(request)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("越界字段（RichText 变更携带 title）→ 整次无效", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        {
          componentId: "rich-1",
          type: "RichText",
          blocks: [{ type: "paragraph", text: "新内容" }],
          title: "越界字段",
        },
      ]),
    );

    await expect(
      createService().suggestContentChanges(dtoOf(request)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("公告数量与现有不一致 → 整次无效", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        { componentId: "notice-1", type: "Notice", noticeTexts: ["只剩一条"] },
      ]),
    );

    await expect(
      createService().suggestContentChanges(dtoOf(request)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("富文本中的标签与事件属性被转义为纯文本，不产生可执行 HTML", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        {
          componentId: "rich-1",
          type: "RichText",
          blocks: [
            {
              type: "paragraph",
              text: '<script>alert("x")</script><img src=x onerror="alert(1)">',
            },
            {
              type: "list",
              ordered: false,
              items: ['<a href="javascript:alert(1)">链接</a>'],
            },
          ],
        },
      ]),
    );

    const result = await createService().suggestContentChanges(dtoOf(request));
    const html = result.changes[0]?.html ?? "";

    // 危险内容只能是转义后的纯文本，不能成为真实标签
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&lt;a href=&quot;javascript:alert(1)&quot;&gt;");

    // 生成的标签集合必须完全落在受控白名单内（无事件属性、无外链标签）
    const tags = Array.from(html.matchAll(/<\/?([a-z0-9]+)[^>]*>/gi)).map(
      (match) => match[1].toLowerCase(),
    );
    expect([...new Set(tags)].sort()).toEqual(["li", "p", "ul"]);
  });

  it("建议内容与当前一致时剔除（无实际变化返回空 changes）", async () => {
    suggestContentChanges.mockResolvedValue(
      modelDraft([
        {
          componentId: "rich-1",
          type: "RichText",
          blocks: [{ type: "paragraph", text: "旧的开班说明" }],
        },
        {
          componentId: "notice-1",
          type: "Notice",
          noticeTexts: ["旧公告一", "旧公告二"],
        },
        {
          componentId: "form-1",
          type: "BusinessForm",
          title: "培训登记",
          subtitle: "请填写信息",
          submitText: "提交",
        },
      ]),
    );

    const result = await createService().suggestContentChanges(dtoOf(request));

    expect(result.source).toBe("model");
    expect(result.changes).toHaveLength(0);
  });

  it("mock 模式：来源明确标注，数量与顺序保持，文本加示例前缀", async () => {
    isMockMode.mockReturnValue(true);

    const result = await createService().suggestContentChanges(dtoOf(request));

    expect(result.source).toBe("mock");
    expect(result.warnings.join("")).toContain("示例");
    expect(result.changes).toHaveLength(3);

    const noticeChange = result.changes.find(
      (item) => item.componentId === "notice-1",
    );
    expect(noticeChange?.noticeTexts).toEqual([
      "（示例）旧公告一",
      "（示例）旧公告二",
    ]);

    const richChange = result.changes.find(
      (item) => item.componentId === "rich-1",
    );
    expect(richChange?.html).toContain("（示例）旧的开班说明");
  });

  it("模型不可用且未开启 mock → 明确错误，不冒充生成成功", async () => {
    suggestContentChanges.mockResolvedValue(null);
    isMockMode.mockReturnValue(false);

    await expect(
      createService().suggestContentChanges(dtoOf(request)),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it("请求本身不合法（重复目标 / 越界字段）→ BadRequestException", async () => {
    const service = createService();

    await expect(
      service.suggestContentChanges(
        dtoOf({
          instruction: "x",
          targets: [
            { componentId: "a", type: "RichText", content: "c" },
            { componentId: "a", type: "RichText", content: "c" },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.suggestContentChanges(
        dtoOf({
          instruction: "x",
          targets: [
            {
              componentId: "a",
              type: "RichText",
              content: "c",
              noticeTexts: ["越界"],
            },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
