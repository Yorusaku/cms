import type {
  AiContentChange,
  AiContentTarget,
  AiContentTargetType,
  IComponentSchemaV2,
} from "@cms/types";
import { resolveMaterialDefinition } from "@cms/ui";

/** 支持 AI 内容更新的物料类型 */
export const AI_CONTENT_TYPE_LABELS: Record<AiContentTargetType, string> = {
  RichText: "富文本",
  Notice: "公告",
  BusinessForm: "业务表单",
};

const isAiContentType = (type: string): type is AiContentTargetType =>
  Object.prototype.hasOwnProperty.call(AI_CONTENT_TYPE_LABELS, type);

const toText = (value: unknown): string =>
  typeof value === "string" ? value : "";

/**
 * 目标快照：每次生成前记录，既作为请求内容，也作为该次应用前的冲突基线。
 * supported=false 表示该物料不参与本次更新。
 */
export interface AiContentTargetSnapshot {
  componentId: string;
  /** 支持的规范化类型；不支持时为 null */
  type: AiContentTargetType | null;
  /** 物料展示名（如「富文本」「公告」） */
  materialLabel: string;
  supported: boolean;
  /** RichText */
  content?: string;
  /** Notice */
  noticeTexts?: string[];
  /** BusinessForm */
  title?: string;
  subtitle?: string;
  submitText?: string;
}

/** 读取公告项文字（兼容 noticeList / noticelist 两种字段别名） */
export function readNoticeTexts(props: Record<string, unknown>): string[] {
  const list = Array.isArray(props.noticeList)
    ? props.noticeList
    : Array.isArray(props.noticelist)
      ? props.noticelist
      : [];
  return list.map((item) => toText((item as Record<string, unknown>)?.text));
}

/** 从组件快照生成目标（同时标注是否参与更新） */
export function buildContentTargetSnapshot(
  component: IComponentSchemaV2,
): AiContentTargetSnapshot {
  const materialLabel =
    resolveMaterialDefinition(component.type)?.label ?? component.type;
  const props = (component.props ?? {}) as Record<string, unknown>;

  if (!isAiContentType(component.type)) {
    return {
      componentId: component.id,
      type: null,
      materialLabel,
      supported: false,
    };
  }

  if (component.type === "RichText") {
    return {
      componentId: component.id,
      type: "RichText",
      materialLabel,
      supported: true,
      content: toText(props.content),
    };
  }

  if (component.type === "Notice") {
    const noticeTexts = readNoticeTexts(props);
    return {
      componentId: component.id,
      type: "Notice",
      materialLabel,
      supported: noticeTexts.length > 0,
      noticeTexts,
    };
  }

  const title = toText(props.title);
  const subtitle = toText(props.subtitle);
  const submitText = toText(props.submitText);
  return {
    componentId: component.id,
    type: "BusinessForm",
    materialLabel,
    supported: [title, subtitle, submitText].some((item) => item.length > 0),
    title,
    subtitle,
    submitText,
  };
}

/** 把快照转成接口请求目标（只带该类型允许的字段） */
export function snapshotToRequestTarget(
  snapshot: AiContentTargetSnapshot,
): AiContentTarget | null {
  if (!snapshot.supported || !snapshot.type) {
    return null;
  }

  if (snapshot.type === "RichText") {
    return {
      componentId: snapshot.componentId,
      type: "RichText",
      content: snapshot.content ?? "",
    };
  }

  if (snapshot.type === "Notice") {
    const noticeTexts = [...(snapshot.noticeTexts ?? [])];
    if (noticeTexts.length === 0) {
      return null;
    }
    return {
      componentId: snapshot.componentId,
      type: "Notice",
      noticeTexts,
    };
  }

  return {
    componentId: snapshot.componentId,
    type: "BusinessForm",
    title: snapshot.title,
    subtitle: snapshot.subtitle,
    submitText: snapshot.submitText,
  };
}

/**
 * 应用前冲突校验：组件仍存在、类型一致、相关内容与基线完全相同。
 * 同时兼容公告字段别名（任一别名变化都视为已变化）。
 */
export function isTargetUnchanged(
  snapshot: AiContentTargetSnapshot,
  component: IComponentSchemaV2 | undefined,
): boolean {
  if (!component || component.type !== snapshot.type) {
    return false;
  }

  const props = (component.props ?? {}) as Record<string, unknown>;

  if (snapshot.type === "RichText") {
    return toText(props.content) === (snapshot.content ?? "");
  }

  if (snapshot.type === "Notice") {
    const current = readNoticeTexts(props);
    const baseline = snapshot.noticeTexts ?? [];
    return (
      current.length === baseline.length &&
      current.every((text, index) => text === baseline[index])
    );
  }

  if (snapshot.type === "BusinessForm") {
    return (
      toText(props.title) === (snapshot.title ?? "") &&
      toText(props.subtitle) === (snapshot.subtitle ?? "") &&
      toText(props.submitText) === (snapshot.submitText ?? "")
    );
  }

  return false;
}

/** HTML → 纯文本（仅用于对比展示，不用于渲染） */
export function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|ol|ul|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

/** 原内容展示文本 */
export function formatSnapshotPreview(
  snapshot: AiContentTargetSnapshot,
): string {
  if (snapshot.type === "RichText") {
    return stripHtmlToText(snapshot.content ?? "");
  }
  if (snapshot.type === "Notice") {
    return (snapshot.noticeTexts ?? []).join("\n");
  }
  return [
    snapshot.title ? `标题：${snapshot.title}` : "",
    snapshot.subtitle ? `说明：${snapshot.subtitle}` : "",
    snapshot.submitText ? `按钮：${snapshot.submitText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * 建议内容展示文本。富文本用受控 blocks 转纯文本，
 * 不渲染 HTML，避免对比区域直接消费模型原始输出。
 */
export function formatChangePreview(change: AiContentChange): string {
  if (change.type === "RichText") {
    return (change.blocks ?? [])
      .map((block) => {
        if (block.type === "list") {
          return block.items
            .map((item, index) =>
              block.ordered ? `${index + 1}. ${item}` : `• ${item}`,
            )
            .join("\n");
        }
        if (block.type === "heading") {
          return `【${block.text}】`;
        }
        return block.text;
      })
      .join("\n");
  }

  if (change.type === "Notice") {
    return (change.noticeTexts ?? []).join("\n");
  }

  return [
    change.title !== undefined ? `标题：${change.title}` : "",
    change.subtitle !== undefined ? `说明：${change.subtitle}` : "",
    change.submitText !== undefined ? `按钮：${change.submitText}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
