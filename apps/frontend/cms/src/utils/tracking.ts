import http from "@/utils/http";
import type { MarketingTrackEvent } from "@cms/types";

const TRACKING_ENABLED = String(import.meta.env.VITE_TRACKING_ENABLED ?? "true") !== "false";

const SESSION_KEY = "__cms_tracking_session__";

const getSessionId = () => {
  const current = sessionStorage.getItem(SESSION_KEY);
  if (current) {
    return current;
  }
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  sessionStorage.setItem(SESSION_KEY, next);
  return next;
};

const pickParams = (source: URLSearchParams, prefixes: string[]) => {
  const result: Record<string, string> = {};
  source.forEach((value, key) => {
    if (prefixes.some((prefix) => key.startsWith(prefix))) {
      result[key] = value;
    }
  });
  return result;
};

export const extractMarketingParams = (search: string) => {
  const params = new URLSearchParams(search || "");
  return {
    utm: pickParams(params, ["utm_"]),
    channel: pickParams(params, ["channel_", "ch_", "src_", "campaign_", "ad_"]),
  };
};

export const getMarketingParamsFromLocation = () => {
  const search = window.location.search || "";
  return extractMarketingParams(search);
};

export const trackEvent = async (event: MarketingTrackEvent) => {
  if (!TRACKING_ENABLED) {
    return;
  }

  const payload = {
    ...event,
    sessionId: getSessionId(),
    timestamp: event.timestamp ?? Date.now(),
  };

  try {
    await http.post("/atlas-cms/trackEvent", payload, {
      skipAuth: true,
    });
  } catch {
    // 埋点失败不影响主流程
  }
};

export const isTrackingEnabled = () => TRACKING_ENABLED;
