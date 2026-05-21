import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/http", () => ({
  default: {
    post: vi.fn(),
  },
}));

import http from "@/utils/http";
import {
  extractMarketingParams,
  getMarketingParamsFromLocation,
  isTrackingEnabled,
  trackEvent,
} from "@/utils/tracking";

describe("cms tracking utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("extractMarketingParams parses utm and channel params", () => {
    const params = extractMarketingParams(
      "?utm_source=douyin&utm_campaign=618&channel_id=ad001&ch_scene=feed&foo=bar",
    );

    expect(params.utm).toEqual({
      utm_source: "douyin",
      utm_campaign: "618",
    });
    expect(params.channel).toEqual({
      channel_id: "ad001",
      ch_scene: "feed",
    });
  });

  it("getMarketingParamsFromLocation reads from window.location.search", () => {
    window.history.replaceState({}, "", "/?utm_medium=cpc&campaign_name=summer&ad_id=789");

    const params = getMarketingParamsFromLocation();
    expect(params.utm).toEqual({ utm_medium: "cpc" });
    expect(params.channel).toEqual({
      campaign_name: "summer",
      ad_id: "789",
    });
  });

  it("trackEvent sends payload with sessionId and skipAuth", async () => {
    (http.post as ReturnType<typeof vi.fn>).mockResolvedValue({ code: 10000, data: {} });

    await trackEvent({
      eventType: "cta_click",
      pageId: 1,
      ctaText: "publish_page",
    });

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, payload, config] = (http.post as ReturnType<typeof vi.fn>).mock.calls[0];

    expect(url).toBe("/atlas-cms/trackEvent");
    expect(payload.eventType).toBe("cta_click");
    expect(payload.pageId).toBe(1);
    expect(payload.ctaText).toBe("publish_page");
    expect(typeof payload.sessionId).toBe("string");
    expect(typeof payload.timestamp).toBe("number");
    expect(config).toMatchObject({ skipAuth: true });
  });

  it("tracking enabled defaults to true", () => {
    expect(isTrackingEnabled()).toBe(true);
  });
});
