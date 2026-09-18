import http from "@/utils/http";
import type { ResponseData } from "@cms/utils";

export interface SubmitLeadPayload {
  requestId: string;
  name: string;
  phoneNumber: string;
  remark?: string;
  pageId: number;
  publishedVersionId: string;
  sessionId: string;
  utm?: Record<string, string>;
  channel?: Record<string, string>;
}

export const submitLead = (payload: SubmitLeadPayload): Promise<ResponseData<{ id: number; duplicated: boolean }>> => {
  return http.post<{ id: number; duplicated: boolean }>("/atlas-cms/submitLead", payload, {
    showError: true,
    skipAuth: true,
  });
};
