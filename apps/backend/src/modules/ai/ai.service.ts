import { BadRequestException, Injectable } from "@nestjs/common";
import {
  AiGeneratePageRequestSchema,
  PageSchemaV2Schema,
  type AiDiagnosePageResponse,
  type AiPageAdvice,
  type AiGeneratePageRequest,
  type AiGeneratePageResponse,
  type AiProductInput,
  type IComponentSchemaV2,
  type IPageSchemaV2,
} from "@cms/types";
import { PageService } from "../page/page.service";
import { TrackingService } from "../tracking/tracking.service";
import { AiProviderService } from "./ai-provider.service";
import { AiDiagnosePageDto } from "./dto/ai-diagnose-page.dto";
import { AiGeneratePageDto } from "./dto/ai-generate-page.dto";

const DEFAULT_COVER_BG = "#e11d48";
const DEFAULT_ACCENT_BG = "#f59e0b";

@Injectable()
export class AiService {
  constructor(
    private readonly pageService: PageService,
    private readonly aiProviderService: AiProviderService,
    private readonly trackingService: TrackingService,
  ) {}

  async generatePage(dto: AiGeneratePageDto): Promise<AiGeneratePageResponse> {
    const request = this.parseGenerateRequest(dto);
    const warnings: string[] = [];
    const providerDraft = await this.aiProviderService.generatePageDraft(
      request,
      this.getMaterialContract(),
    );
    const providerSchema = providerDraft
      ? this.normalizeProviderSchema(providerDraft.schema, warnings)
      : null;
    const schema = providerSchema ?? this.createMockMarketingSchema(request, warnings);

    if (!providerSchema && providerDraft) {
      warnings.push("模型生成结果未通过平台校验，已回退为 mock 草稿。");
    }

    warnings.push(...(providerDraft?.warnings ?? []));
    const result = PageSchemaV2Schema.safeParse(schema);

    if (!result.success) {
      throw new BadRequestException("AI 生成的页面结构未通过 Schema 校验");
    }

    const saved = await this.pageService.addPageJson({
      name: request.pageName,
      schema: result.data,
      componentList: [],
      shareDesc: `${request.promotion}，${request.ctaText}`,
      shareImage: "",
      backgroundColor: String(result.data.pageConfig.backgroundColor ?? "#ffffff"),
      backgroundImage: "",
      backgroundPosition: "top",
      cover: "",
      online: 0,
    });

    const summary =
      providerSchema && providerDraft?.summary
        ? providerDraft.summary
        : `已根据「${request.activityType}」生成 ${result.data.rootIds.length} 个营销模块，页面已保存为草稿。`;

    return {
      pageId: saved.id,
      schema: result.data,
      summary,
      warnings,
    };
  }

  async diagnosePage(dto: AiDiagnosePageDto): Promise<AiDiagnosePageResponse> {
    const page = await this.pageService.getPageJson(dto.pageId);
    const schemaResult = PageSchemaV2Schema.safeParse(page.schema);

    if (!schemaResult.success) {
      throw new BadRequestException("页面 Schema 无法用于 AI 诊断");
    }

    const funnel = await this.trackingService.getPageFunnelSummary({
      pageId: dto.pageId,
    });
    const schema = schemaResult.data as IPageSchemaV2;
    const advice = this.buildPageAdvice(schema, funnel);

    return {
      pageId: dto.pageId,
      summary: this.buildDiagnosisSummary(funnel),
      advice,
    };
  }

  private parseGenerateRequest(dto: AiGeneratePageDto): AiGeneratePageRequest {
    const result = AiGeneratePageRequestSchema.safeParse({
      ...dto,
      products: dto.products ?? [],
    });

    if (!result.success) {
      throw new BadRequestException("AI 建页参数不合法");
    }

    return result.data;
  }

  private buildPageAdvice(
    schema: IPageSchemaV2,
    funnel: {
      metrics: {
        pageViews: number;
        ctaClicks: number;
        formSubmits: number;
        leads: number;
        ctaClickRate: number;
        leadConversionRate: number;
      };
    },
  ): AiPageAdvice[] {
    const components = schema.rootIds
      .map((id) => schema.componentMap[id])
      .filter(Boolean);
    const advice: AiPageAdvice[] = [];
    const hasLeadForm = components.some((component) => component.type === "LeadForm");
    const hasProduct = components.some((component) => component.type === "Product");
    const richText = components.find((component) => component.type === "RichText");
    const leadForm = components.find((component) => component.type === "LeadForm");

    if (!hasLeadForm) {
      advice.push({
        category: "form",
        severity: "critical",
        problem: "页面没有线索表单，访问无法沉淀为可跟进线索。",
        suggestion: "增加姓名、手机号和需求备注字段，并在首屏或商品区后放置明确的留资入口。",
        expectedImpact: "补齐从访问到线索的转化路径。",
      });
    }

    if (!hasProduct) {
      advice.push({
        category: "product",
        severity: "warning",
        problem: "页面缺少商品或权益展示模块。",
        suggestion: "增加商品、套餐或会员权益区，明确价格、卖点和行动按钮。",
        expectedImpact: "降低用户理解成本，增强购买或留资理由。",
      });
    }

    if (!richText || this.getStringProp(richText.props, "content").length < 40) {
      advice.push({
        category: "copywriting",
        severity: "warning",
        targetComponentId: richText?.id,
        problem: "页面价值主张内容偏少，用户可能无法快速理解活动利益点。",
        suggestion: "在首屏附近补充目标人群、核心利益、使用场景和限时理由。",
        expectedImpact: "提升首屏信息密度和活动理解度。",
      });
    }

    if (funnel.metrics.pageViews >= 10 && funnel.metrics.ctaClickRate < 0.05) {
      advice.push({
        category: "cta",
        severity: "critical",
        problem: `当前 CTA 点击率为 ${(funnel.metrics.ctaClickRate * 100).toFixed(2)}%，低于建议阈值 5%。`,
        suggestion: "把 CTA 文案改成具体收益导向，并在首屏、商品区和表单前各保留一个主要行动入口。",
        expectedImpact: "提升访问到行动的转化效率。",
      });
    }

    if (funnel.metrics.pageViews >= 10 && funnel.metrics.leads === 0) {
      advice.push({
        category: "form",
        severity: "critical",
        targetComponentId: leadForm?.id,
        problem: "页面已有访问数据，但暂无线索沉淀。",
        suggestion: "检查手机号校验、提交接口、表单可见性和成功反馈，并减少非必要字段。",
        expectedImpact: "避免有效访问在提交环节流失。",
      });
    }

    if (funnel.metrics.formSubmits > 0 && funnel.metrics.leads < funnel.metrics.formSubmits) {
      advice.push({
        category: "tracking",
        severity: "warning",
        targetComponentId: leadForm?.id,
        problem: "表单提交事件数高于实际线索数，埋点与后端入库可能存在偏差。",
        suggestion: "核对提交成功回调是否只在后端保存成功后触发，并检查 pageId、渠道参数是否透传。",
        expectedImpact: "提高转化数据可信度，避免误判投放效果。",
      });
    }

    if (components.length < 4) {
      advice.push({
        category: "structure",
        severity: "info",
        problem: "页面区块较少，可能缺少信任背书或风险消除内容。",
        suggestion: "补充使用场景、用户权益、服务保障或 FAQ 区块，再引导用户提交线索。",
        expectedImpact: "增强页面完整度和决策信心。",
      });
    }

    if (advice.length === 0) {
      advice.push({
        category: "structure",
        severity: "info",
        problem: "当前页面结构和基础漏斗没有发现明显问题。",
        suggestion: "继续积累不同渠道和时间段数据，再观察 CTA 与线索转化率变化。",
        expectedImpact: "为后续精细化优化和 A/B 实验积累基线。",
      });
    }

    return advice;
  }

  private buildDiagnosisSummary(funnel: {
    metrics: {
      pageViews: number;
      ctaClicks: number;
      formSubmits: number;
      leads: number;
      ctaClickRate: number;
      leadConversionRate: number;
    };
  }): string {
    const metrics = funnel.metrics;
    return `当前页面累计 ${metrics.pageViews} 次访问、${metrics.ctaClicks} 次 CTA 点击、${metrics.formSubmits} 次表单提交，沉淀 ${metrics.leads} 条线索，线索转化率 ${(metrics.leadConversionRate * 100).toFixed(2)}%。`;
  }

  private getStringProp(
    props: Record<string, unknown>,
    key: string,
  ): string {
    return typeof props[key] === "string" ? props[key] : "";
  }

  private createMockMarketingSchema(
    request: AiGeneratePageRequest,
    warnings: string[],
  ): IPageSchemaV2 {
    const products = this.normalizeProducts(request.products, request, warnings);
    const leadGoal = this.normalizeText(request.leadGoal, "领取优惠并留下联系方式");
    const styleTone = this.normalizeText(request.styleTone, "热烈促销");
    const heroImage = this.createPlaceholderImage(request.pageName, DEFAULT_COVER_BG);
    const iconImage = this.createPlaceholderImage("优惠", DEFAULT_ACCENT_BG);
    const floatImage = this.createPlaceholderImage("咨询", "#0f766e");

    const banner = this.createComponent("ai-carousel", "Carousel", {
      imageList: [
        {
          imageUrl: heroImage,
          text: request.pageName,
          link: this.createLink("#lead-form"),
        },
      ],
      autoplay: 3000,
      showIndicators: true,
      showArrows: true,
      height: "210px",
      backgroundColor: DEFAULT_COVER_BG,
      imageFit: "cover",
      loop: true,
    });

    const notice = this.createComponent("ai-notice", "Notice", {
      component: "Notice",
      validTime: [],
      noticeList: [
        {
          text: `${request.promotion}，名额有限，先到先得`,
          link: this.createLink("#lead-form"),
        },
      ],
      noticelist: [
        {
          text: `${request.promotion}，名额有限，先到先得`,
          link: this.createLink("#lead-form"),
        },
      ],
      iconUrl: iconImage,
      imageUrl: iconImage,
      backgroundColor: "#fff7ed",
      textColor: "#9a3412",
      speed: 20,
    });

    const intro = this.createComponent("ai-intro", "RichText", {
      content: this.createIntroHtml(request, leadGoal, styleTone),
      backgroundColor: "#ffffff",
      padding: "16px 14px 8px",
    });

    const product = this.createComponent("ai-products", "Product", {
      component: "Product",
      validTime: [],
      marginTop: 0,
      list: products,
      productList: products,
      layoutType: "oneLineTwo",
      listStyle: "oneLineTwo",
      showPurchase: true,
      purchase: 1,
      priceColor: "#e11d48",
      exchangePriceColor: "#e11d48",
      markingPrice: 1,
      sortType: "customsort",
      priceSortType: "order",
      outOfStock: "show",
      beOverdue: 1,
    });

    const leadForm = this.createComponent("lead-form", "LeadForm", {
      title: "领取专属优惠",
      subtitle: leadGoal,
      submitText: request.ctaText,
      submittingText: "提交中...",
      successText: "提交成功，稍后将有专人与您联系",
      errorText: "提交失败，请稍后重试",
      namePlaceholder: "请输入姓名",
      phonePlaceholder: "请输入手机号",
      remarkPlaceholder: "备注需求（选填）",
      pageId: 0,
      trackingEnabled: true,
    });

    const floatLayer = this.createComponent("ai-float", "FloatLayer", {
      component: "FloatLayer",
      validTime: [],
      imageUrl: floatImage,
      defaultImage: floatImage,
      link: this.createLink("#lead-form"),
      hideByPageScroll: true,
      width: 72,
      bottom: 90,
      right: 20,
      zIndex: 20,
    });

    return {
      version: "2.0.0",
      pageConfig: {
        name: request.pageName,
        shareDesc: `${request.promotion}，${request.ctaText}`,
        shareImage: "",
        backgroundColor: "#fff7ed",
        backgroundImage: "",
        backgroundPosition: "top",
        cover: "",
      },
      componentMap: {
        [banner.id]: banner,
        [notice.id]: notice,
        [intro.id]: intro,
        [product.id]: product,
        [leadForm.id]: leadForm,
        [floatLayer.id]: floatLayer,
      },
      rootIds: [
        banner.id,
        notice.id,
        intro.id,
        product.id,
        leadForm.id,
        floatLayer.id,
      ],
      tracking: {
        enabled: true,
        context: {
          source: "ai_generate_page",
          activityType: request.activityType,
          audience: request.audience,
        },
      },
    };
  }

  private normalizeProviderSchema(
    rawSchema: unknown,
    warnings: string[],
  ): IPageSchemaV2 | null {
    const result = PageSchemaV2Schema.safeParse(rawSchema);
    if (!result.success) {
      return null;
    }

    const schema = result.data as IPageSchemaV2;
    const allowedTypes = new Set([
      "Carousel",
      "Notice",
      "RichText",
      "Product",
      "LeadForm",
      "Dialog",
      "AssistLine",
      "FloatLayer",
    ]);

    for (const componentId of schema.rootIds) {
      const component = schema.componentMap[componentId];
      if (!component || !allowedTypes.has(component.type)) {
        return null;
      }

      component.parentId = null;
      component.children = [];
      component.condition = component.condition ?? true;
      component.props = component.props ?? {};

      if (component.type === "RichText") {
        const content = component.props.content;
        component.props.content =
          typeof content === "string"
            ? this.sanitizeRichText(content)
            : "<p>请填写页面内容</p>";
      }
    }

    if (!schema.rootIds.some((id) => schema.componentMap[id]?.type === "LeadForm")) {
      warnings.push("模型结果缺少线索表单，已回退为 mock 草稿。");
      return null;
    }

    schema.tracking = {
      enabled: true,
      context: {
        ...(schema.tracking?.context ?? {}),
        source: "ai_generate_page",
      },
    };

    return schema;
  }

  private getMaterialContract(): string {
    return JSON.stringify(
      [
        "Carousel: props.imageList[{imageUrl,text,link}], height, backgroundColor",
        "Notice: props.noticeList[{text,link}], iconUrl, backgroundColor, textColor",
        "RichText: props.content, backgroundColor, padding",
        "Product: props.list[{id,imageUrl,imgUrl,brand,categoryNames,price,originPrice}], layoutType, showPurchase, priceColor",
        "LeadForm: props.title, subtitle, submitText, namePlaceholder, phonePlaceholder, remarkPlaceholder, trackingEnabled",
        "Dialog: props.title, content, confirmText, cancelText, visible",
        "AssistLine: props.height, type, borderColor, backgroundColor",
        "FloatLayer: props.imageUrl, defaultImage, link, width, bottom, right",
      ],
      null,
      2,
    );
  }

  private normalizeProducts(
    products: AiProductInput[],
    request: AiGeneratePageRequest,
    warnings: string[],
  ) {
    const sourceProducts =
      products.length > 0
        ? products
        : [
            {
              name: `${request.activityType}精选套餐`,
              price: "99",
              originalPrice: "199",
              sellingPoint: request.promotion,
            },
            {
              name: "人气爆款组合",
              price: "129",
              originalPrice: "259",
              sellingPoint: "限时加赠专属服务",
            },
          ];

    if (products.length === 0) {
      warnings.push("未填写商品信息，已使用 AI 默认示例商品。");
    }

    return sourceProducts.slice(0, 6).map((item, index) => ({
      id: `ai-product-${index + 1}`,
      imageUrl:
        item.imageUrl ||
        this.createPlaceholderImage(item.name || `商品${index + 1}`, "#be123c"),
      imgUrl:
        item.imageUrl ||
        this.createPlaceholderImage(item.name || `商品${index + 1}`, "#be123c"),
      brand: this.normalizeText(item.name, `商品${index + 1}`),
      categoryNames: this.normalizeText(item.sellingPoint, request.promotion),
      price: this.normalizePrice(item.price, 99 + index * 30),
      originPrice: this.normalizePrice(item.originalPrice, 199 + index * 50),
    }));
  }

  private createIntroHtml(
    request: AiGeneratePageRequest,
    leadGoal: string,
    styleTone: string,
  ): string {
    const safePageName = this.escapeHtml(request.pageName);
    const safeAudience = this.escapeHtml(request.audience);
    const safePromotion = this.escapeHtml(request.promotion);
    const safeLeadGoal = this.escapeHtml(leadGoal);
    const safeStyleTone = this.escapeHtml(styleTone);
    const safeExtraPrompt = this.escapeHtml(request.extraPrompt || "");

    return [
      `<h2 style="margin:0 0 8px;color:#111827;font-size:20px;">${safePageName}</h2>`,
      `<p style="margin:0 0 8px;color:#374151;line-height:1.7;">面向${safeAudience}，主打${safePromotion}。</p>`,
      `<p style="margin:0 0 8px;color:#374151;line-height:1.7;">页面风格建议：${safeStyleTone}，核心转化目标：${safeLeadGoal}。</p>`,
      safeExtraPrompt
        ? `<p style="margin:0;color:#6b7280;line-height:1.7;">补充说明：${safeExtraPrompt}</p>`
        : "",
    ].join("");
  }

  private createComponent(
    id: string,
    type: string,
    props: Record<string, unknown>,
    styles: Record<string, string> = {},
  ): IComponentSchemaV2 {
    return {
      id,
      type,
      props,
      styles,
      parentId: null,
      children: [],
      condition: true,
    };
  }

  private createLink(url: string) {
    return {
      clickType: 1,
      data: {
        url,
      },
    };
  }

  private createPlaceholderImage(label: string, backgroundColor: string): string {
    const safeLabel = this.escapeHtml(label).slice(0, 12);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="360" viewBox="0 0 750 360"><rect width="750" height="360" fill="${backgroundColor}"/><text x="375" y="190" font-size="42" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif">${safeLabel}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  private normalizeText(value: string | undefined, fallback: string): string {
    const text = value?.trim();
    return text ? text.slice(0, 120) : fallback;
  }

  private normalizePrice(value: string | number | undefined, fallback: number) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return fallback;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private sanitizeRichText(value: string): string {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
      .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
      .replace(/\son\w+="[^"]*"/gi, "")
      .replace(/\son\w+='[^']*'/gi, "")
      .replace(/javascript:/gi, "");
  }
}
