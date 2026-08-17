import http from "@/utils/http";
import type {
  AiDiagnosePageRequest,
  AiDiagnosePageResponse,
  AiGeneratePageRequest,
  AiGeneratePageResponse,
} from "@cms/types";
import {
  AiDiagnosePageResponseSchema,
  AiGeneratePageResponseSchema,
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
