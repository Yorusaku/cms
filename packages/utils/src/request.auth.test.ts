import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Request from "./request";

type RequestHeaders = Record<string, string>;

describe("Request auth header", () => {
  const token = "mock-token";

  const createMockResponse = (headers: RequestHeaders) => ({
    status: 200,
    statusText: "OK",
    headers: {},
    config: { headers },
    data: {
      code: 10000,
      message: "success",
      data: { headers },
    },
  });

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", token);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("injects Authorization Bearer header by default", async () => {
    const request = new Request({ baseURL: "http://localhost" });

    vi.spyOn(axios.Axios.prototype, "request").mockImplementation(async (config) => {
      const headers = (config.headers || {}) as RequestHeaders;
      if (!headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
      }
      return createMockResponse(headers) as any;
    });

    const response = await request.get<{ headers: RequestHeaders }>("/foo");
    expect(response.data.headers.Authorization).toBe(`Bearer ${token}`);
  });

  it("does not inject Authorization header when skipAuth is true", async () => {
    const request = new Request({ baseURL: "http://localhost" });

    vi.spyOn(axios.Axios.prototype, "request").mockImplementation(async (config) => {
      const headers = (config.headers || {}) as RequestHeaders;
      return createMockResponse(headers) as any;
    });

    const response = await request.get<{ headers: RequestHeaders }>("/foo", {
      skipAuth: true,
    });

    expect(response.data.headers.Authorization).toBeUndefined();
  });
});
