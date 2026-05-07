import type { Page, Route } from "@playwright/test";
import {
  mockLoginResponse,
  mockPageListResponse,
  mockPageDetailResponse,
  mockPublishLogsResponse,
  successResponse,
  authFailedResponse,
} from "./api-mocks";

type RouteHandler = (route: Route) => Promise<void>;

export function setupApiMocks(page: Page) {
  const handlers: Array<{ pattern: string | RegExp; handler: RouteHandler }> = [
    {
      pattern: /\/api\/atlas-cms\/login$/,
      handler: async (route) => {
        await route.fulfill({ json: mockLoginResponse() });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/getPageList/,
      handler: async (route) => {
        await route.fulfill({
          json: successResponse({
            list: mockPageListResponse(),
            total: 12,
            pageNum: 1,
            pageSize: 10,
          }),
        });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/getPageJson/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const pageId = parseInt(url.searchParams.get("id") || "1", 10);
        await route.fulfill({ json: successResponse(mockPageDetailResponse(pageId)) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/addPageJson$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse({ id: 99 }) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/updateCmsJson$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse(null) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/deletePage$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse(null) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/updatePageStatus$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse(null) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/getPagePublishLogs/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const pageId = parseInt(url.searchParams.get("pageId") || "1", 10);
        await route.fulfill({ json: successResponse(mockPublishLogsResponse(pageId)) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/rollbackPageVersion$/,
      handler: async (route) => {
        await route.fulfill({
          json: successResponse({ schema: mockPageDetailResponse(1).schema }),
        });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/upload/,
      handler: async (route) => {
        await route.fulfill({
          json: successResponse({ data: "http://127.0.0.1:3300/uploads/mock-image.png" }),
        });
      },
    },
  ];

  for (const { pattern, handler } of handlers) {
    page.route(pattern, handler);
  }
}

export function setupFailedAuthMock(page: Page) {
  page.route(/\/api\/atlas-cms\/login$/, async (route) => {
    await route.fulfill({ json: authFailedResponse() });
  });
  page.route(/\/api\/atlas-cms\/getPageList/, async (route) => {
    await route.fulfill({ json: authFailedResponse() });
  });
}
