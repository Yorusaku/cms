import http from "@/utils/http";
import type { ResponseData } from "@cms/utils";

export interface SubmitLeadPayload {
  name: string;
  phoneNumber: string;
  remark?: string;
  pageId?: number;
  utm?: Record<string, string>;
  channel?: Record<string, string>;
}

export const submitLead = (payload: SubmitLeadPayload): Promise<ResponseData<{ id: number }>> => {
  return http.post<{ id: number }>("/atlas-cms/submitLead", payload, {
    showError: true,
    skipAuth: true,
  });
};
