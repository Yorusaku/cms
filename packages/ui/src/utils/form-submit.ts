/**
 * 表单物料共用的提交能力（LeadFormBlock / BusinessFormBlock 复用）。
 *
 * 约束：
 * - 只依赖浏览器全局（fetch / localStorage / sessionStorage / window），
 *   不引入 CRS 私有模块，保证 @cms/ui 可被 CMS 与 CRS 同源消费；
 * - 请求契约与 POST /atlas-cms/submitLead、/atlas-cms/trackEvent 保持一致。
 */

/** 与后端 CreateLeadDto 的 @Matches 保持一致 */
export const PHONE_NUMBER_REG = /^1[3-9]\d{9}$/;

/** 与后端 CreateLeadDto 的 remark @MaxLength 保持一致 */
export const REMARK_MAX_LENGTH = 500;

/** 业务码成功值，与后端 ApiCode.SUCCESS 一致 */
const API_SUCCESS_CODE = 10000;

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
  consentAccepted: boolean;
}

export interface FormSubmitTrackingPayload {
  eventType: "form_submit";
  pageId: number;
  publishedVersionId: string;
  payload?: Record<string, unknown>;
  utm?: Record<string, string>;
  channel?: Record<string, string>;
}

export const getBaseApiUrl = (): string => {
  if (typeof import.meta !== "undefined") {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    if (env?.VITE_API_BASE_URL) {
      return env.VITE_API_BASE_URL;
    }
  }
  return "/api";
};

export const getTrackingSessionId = (): string => {
  const key = "__crs_tracking_session__";
  const current = sessionStorage.getItem(key);
  if (current) {
    return current;
  }
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(key, next);
  return next;
};

/** 从 URL（兼容 hash 路由）提取 utm 与渠道参数 */
export const getMarketingParams = () => {
  const querySource =
    window.location.hash && window.location.hash.includes("?")
      ? window.location.hash.slice(window.location.hash.indexOf("?"))
      : window.location.search;

  const params = new URLSearchParams(querySource || "");
  const pickByPrefixes = (prefixes: string[]) => {
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        result[key] = value;
      }
    });
    return result;
  };

  return {
    utm: pickByPrefixes(["utm_"]),
    channel: pickByPrefixes(["channel_", "ch_", "src_", "campaign_", "ad_"]),
  };
};

export const buildApiUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const base = getBaseApiUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};

const requestJson = async (url: string, payload: unknown) => {
  const token = localStorage.getItem("token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as {
    code?: number;
    message?: string;
  };

  if (typeof body.code === "number" && body.code !== API_SUCCESS_CODE) {
    throw new Error(body.message || "request_failed");
  }
};

export const submitLeadRequest = (
  payload: SubmitLeadPayload,
  endpoint: string,
) => requestJson(buildApiUrl(endpoint), payload);

export const trackFormSubmitRequest = (
  payload: FormSubmitTrackingPayload,
  endpoint: string,
) =>
  requestJson(buildApiUrl(endpoint), {
    ...payload,
    sessionId: getTrackingSessionId(),
    timestamp: Date.now(),
  });

/** requestId 需为 UUID（后端 @IsUUID），优先用 crypto.randomUUID */
export const createRequestId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};
