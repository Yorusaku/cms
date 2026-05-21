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

export const trackEvent = async (event: MarketingTrackEvent) => {
  if (!TRACKING_ENABLED) {
    return;
  }
  try {
    await http.post(
      "/atlas-cms/trackEvent",
      {
        ...event,
        sessionId: getSessionId(),
        timestamp: event.timestamp ?? Date.now(),
      },
      { skipAuth: true },
    );
  } catch {
    // ignore
  }
};
