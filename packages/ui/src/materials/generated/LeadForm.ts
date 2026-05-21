import type { MaterialDefinition, MaterialEditorSchema } from "@cms/types";
import type { Component } from "vue";
import { toBooleanValue, toNumberValue, toRecord, toStringValue } from "../helpers";

type MaterialRuntimeLoader = () => Promise<Component | { default: Component }>;

const leadFormEditorSchema: MaterialEditorSchema = {
  sections: [
    {
      type: "section",
      label: "基础文案",
      fields: [
        {
          type: "text",
          path: "title",
          label: "标题",
          placeholder: "请输入标题",
        },
        {
          type: "text",
          path: "subtitle",
          label: "副标题",
          placeholder: "请输入副标题",
        },
        {
          type: "text",
          path: "submitText",
          label: "提交按钮文案",
          placeholder: "立即提交",
        },
        {
          type: "text",
          path: "submittingText",
          label: "提交中按钮文案",
          placeholder: "提交中...",
        },
        {
          type: "text",
          path: "successText",
          label: "成功提示文案",
          placeholder: "提交成功",
        },
        {
          type: "text",
          path: "errorText",
          label: "失败提示文案",
          placeholder: "提交失败，请稍后重试",
        },
      ],
    },
    {
      type: "section",
      label: "表单占位文案",
      fields: [
        {
          type: "text",
          path: "namePlaceholder",
          label: "姓名占位",
          placeholder: "请输入姓名",
        },
        {
          type: "text",
          path: "phonePlaceholder",
          label: "手机号占位",
          placeholder: "请输入手机号",
        },
        {
          type: "text",
          path: "remarkPlaceholder",
          label: "备注占位",
          placeholder: "备注（选填）",
        },
      ],
    },
    {
      type: "section",
      label: "营销与归因",
      fields: [
        {
          type: "number",
          path: "pageId",
          label: "页面 ID",
          min: 0,
          step: 1,
        },
        {
          type: "switch",
          path: "trackingEnabled",
          label: "启用埋点",
        },
      ],
    },
  ],
};

const leadFormDefaultProps = {
  title: "线索收集",
  subtitle: "",
  submitText: "立即提交",
  submittingText: "提交中...",
  successText: "提交成功",
  errorText: "提交失败，请稍后重试",
  namePlaceholder: "请输入姓名",
  phonePlaceholder: "请输入手机号",
  remarkPlaceholder: "备注（选填）",
  pageId: 0,
  trackingEnabled: true,
};

export const LeadFormMaterialDefinition: MaterialDefinition<MaterialRuntimeLoader, string> = {
  type: "LeadForm",
  aliases: ["leadform", "lead-form"],
  group: "marketing",
  label: "线索表单",
  icon: "单",
  maxCount: 10,
  defaultProps: leadFormDefaultProps,
  runtimeComponent: () => import("../../components/LeadFormBlock.vue"),
  editorConfig: {
    mode: "schema",
    schema: leadFormEditorSchema,
  },
  normalizeProps: (props) => {
    const normalizedProps = toRecord(props);
    return {
      title: toStringValue(normalizedProps.title, leadFormDefaultProps.title),
      subtitle: toStringValue(normalizedProps.subtitle, leadFormDefaultProps.subtitle),
      submitText: toStringValue(normalizedProps.submitText, leadFormDefaultProps.submitText),
      submittingText: toStringValue(
        normalizedProps.submittingText,
        leadFormDefaultProps.submittingText,
      ),
      successText: toStringValue(normalizedProps.successText, leadFormDefaultProps.successText),
      errorText: toStringValue(normalizedProps.errorText, leadFormDefaultProps.errorText),
      namePlaceholder: toStringValue(
        normalizedProps.namePlaceholder,
        leadFormDefaultProps.namePlaceholder,
      ),
      phonePlaceholder: toStringValue(
        normalizedProps.phonePlaceholder,
        leadFormDefaultProps.phonePlaceholder,
      ),
      remarkPlaceholder: toStringValue(
        normalizedProps.remarkPlaceholder,
        leadFormDefaultProps.remarkPlaceholder,
      ),
      pageId: toNumberValue(normalizedProps.pageId, leadFormDefaultProps.pageId),
      trackingEnabled: toBooleanValue(
        normalizedProps.trackingEnabled,
        leadFormDefaultProps.trackingEnabled,
      ),
    };
  },
  toRuntimeProps: (props) => {
    const normalizedProps = toRecord(props);
    return {
      title: toStringValue(normalizedProps.title, leadFormDefaultProps.title),
      subtitle: toStringValue(normalizedProps.subtitle, leadFormDefaultProps.subtitle),
      submitText: toStringValue(normalizedProps.submitText, leadFormDefaultProps.submitText),
      submittingText: toStringValue(
        normalizedProps.submittingText,
        leadFormDefaultProps.submittingText,
      ),
      successText: toStringValue(normalizedProps.successText, leadFormDefaultProps.successText),
      errorText: toStringValue(normalizedProps.errorText, leadFormDefaultProps.errorText),
      namePlaceholder: toStringValue(
        normalizedProps.namePlaceholder,
        leadFormDefaultProps.namePlaceholder,
      ),
      phonePlaceholder: toStringValue(
        normalizedProps.phonePlaceholder,
        leadFormDefaultProps.phonePlaceholder,
      ),
      remarkPlaceholder: toStringValue(
        normalizedProps.remarkPlaceholder,
        leadFormDefaultProps.remarkPlaceholder,
      ),
      pageId: toNumberValue(normalizedProps.pageId, leadFormDefaultProps.pageId),
      trackingEnabled: toBooleanValue(
        normalizedProps.trackingEnabled,
        leadFormDefaultProps.trackingEnabled,
      ),
    };
  },
};
