import http from "@/utils/http";
import type {
  AiDiagnosePageRequest,
  AiDiagnosePageResponse,
  AiGeneratePageRequest,
  AiGeneratePageResponse,
  AiSuggestContentChangesRequest,
  AiSuggestContentChangesResponse,
} from "@cms/types";
import {
  AiDiagnosePageResponseSchema,
  AiGeneratePageResponseSchema,
  AiSuggestContentChangesResponseSchema,
} from "@cms/types";
import type { RequestConfig, ResponseData } from "@cms/utils";

const writeConfig: RequestConfig = { showError: true };

export const aiGeneratePage = async (
  data: AiGeneratePageRequest,
): Promise<ResponseData<AiGeneratePageResponse>> => {
  const response = await http.post<AiGeneratePageResponse>(
    "/atlas-cms/aiGeneratePage",
    data,
    writeConfig,
  );
  AiGeneratePageResponseSchema.safeParse(response.data);
  return response;
};

export const aiDiagnosePage = async (
  data: AiDiagnosePageRequest,
): Promise<ResponseData<AiDiagnosePageResponse>> => {
  const response = await http.post<AiDiagnosePageResponse>(
    "/atlas-cms/aiDiagnosePage",
    data,
    writeConfig,
  );
  AiDiagnosePageResponseSchema.safeParse(response.data);
  return response;
};

/** AI 内容更新建议：只返回逐区块建议，不落库 */
export const aiSuggestContentChanges = async (
  data: AiSuggestContentChangesRequest,
): Promise<ResponseData<AiSuggestContentChangesResponse>> => {
  const response = await http.post<AiSuggestContentChangesResponse>(
    "/atlas-cms/aiSuggestContentChanges",
    data,
    // 请求错误与协议错误均由弹窗提示，避免 HTTP 层重复弹出消息。
    { showError: false },
  );
  if (response.code !== 10000) {
    return response;
  }
  const result = AiSuggestContentChangesResponseSchema.safeParse(response.data);
  if (!result.success) {
    throw new Error("AI 返回的内容格式不正确，请重新生成");
  }
  return { ...response, data: result.data };
};
