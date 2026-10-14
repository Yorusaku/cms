import http from "@/utils/http";
import type { MarketingTrackEvent } from "@cms/types";

const TRACKING_ENABLED = String(import.meta.env.VITE_TRACKING_ENABLED ?? "true") !== "false";
const SESSION_KEY = "__crs_tracking_session__";

const getSessionId = () => {
  const current = sessionStorage.getItem(SESSION_KEY);
  if (current) {
    return current;
  }
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SESSION_KEY, next);
  return next;
};

const pickParams = (params: URLSearchParams, prefixes: string[]) => {
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      result[key] = value;
    }
  });
  return result;
};

export const getMarketingParamsFromLocation = () => {
  const hash = window.location.hash || "";
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
  const params = new URLSearchParams(query);
  return {
    utm: pickParams(params, ["utm_"]),
    channel: pickParams(params, ["channel_", "ch_", "src_", "campaign_", "ad_"]),
  };
};

type MarketingContext = ReturnType<typeof getMarketingParamsFromLocation>;

let cachedMarketingContext: MarketingContext | null = null;

/**
 * 页面级营销上下文（utm / channel），首次读取后缓存。
 *
 * 组件级埋点（cta_click / component_click）默认不带营销参数，
 * 会导致渠道维度漏斗里 CTA 与表单数据全部落到「直接访问」。
 * 这里把上下文缓存下来，由 trackEvent 自动附加，保证渠道口径完整。
 */
export const getMarketingContext = (): MarketingContext => {
  if (!cachedMarketingContext) {
    cachedMarketingContext = getMarketingParamsFromLocation();
  }
  return cachedMarketingContext;
};

/** 清空缓存（页面切换或测试用） */
export const resetMarketingContext = () => {
  cachedMarketingContext = null;
};

export const trackEvent = async (event: MarketingTrackEvent) => {
  if (!TRACKING_ENABLED) {
    return;
  }
  const marketing = getMarketingContext();
  try {
    await http.post(
      "/atlas-cms/trackEvent",
      {
        ...event,
        source: "crs" as const,
        sessionId: getSessionId(),
        timestamp: event.timestamp ?? Date.now(),
        // 事件未显式提供营销参数时，继承页面级上下文
        utm: event.utm ?? marketing.utm,
        channel: event.channel ?? marketing.channel,
      },
      { skipAuth: true },
    );
  } catch {
    // ignore
  }
};
