import type { Page, Route } from "@playwright/test";
import {
  authFailedResponse,
  mockLeadListResponse,
  mockLoginResponse,
  mockPageDetailResponse,
  mockPageListResponse,
  mockPublishLogsResponse,
  mockTemplateListResponse,
  successResponse,
} from "./api-mocks";

type RouteHandler = (route: Route) => Promise<void>;

const readJsonBody = async (route: Route) => {
  const postData = route.request().postData();
  if (!postData) {
    return {};
  }
  try {
    return JSON.parse(postData) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export async function setAuthToken(page: Page, token: string) {
  await page.goto("/cms-manage/login");
  await page.evaluate((t) => localStorage.setItem("token", t), token);
}

export async function setupApiMocks(page: Page) {
  const handlers: Array<{ pattern: string | RegExp; handler: RouteHandler }> = [
    {
      pattern: /\/api\/atlas-cms\/login$/,
      handler: async (route) => {
        await route.fulfill({ json: mockLoginResponse() });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/trackEvent$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse({}) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/submitLead$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse({ id: 1 }) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/getLeadList/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const pageId = Number(url.searchParams.get("pageId") || 1);
        await route.fulfill({ json: successResponse(mockLeadListResponse(pageId)) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/getTemplateList/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse(mockTemplateListResponse()) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/createPageFromTemplate$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse({ id: 99 }) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/getPageList/,
      handler: async (route) => {
        const url = new URL(route.request().url());
        const keyword = (url.searchParams.get("name") || "").trim();
        const all = mockPageListResponse();
        const list = keyword ? all.filter((item) => item.name.includes(keyword)) : all;

        await route.fulfill({
          json: successResponse({
            list,
            total: list.length,
            pageNum: Number(url.searchParams.get("pageNum") || 1),
            pageSize: Number(url.searchParams.get("pageSize") || 10),
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
        await route.fulfill({ json: successResponse({ id: 1 }) });
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
    {
      pattern: /\/api\/atlas-cms\/getUserList$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse([]) });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/createUser$/,
      handler: async (route) => {
        const body = await readJsonBody(route);
        await route.fulfill({
          json: successResponse({
            id: "u-1",
            username: body.username || "user",
            role: body.role || "editor",
            nickname: body.nickname || null,
            createTime: "2026-05-20 10:00:00",
            updateTime: "2026-05-20 10:00:00",
          }),
        });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/updateUser$/,
      handler: async (route) => {
        const body = await readJsonBody(route);
        await route.fulfill({
          json: successResponse({
            id: body.id || "u-1",
            username: "user",
            role: body.role || "editor",
            nickname: body.nickname || null,
            createTime: "2026-05-20 10:00:00",
            updateTime: "2026-05-20 10:10:00",
          }),
        });
      },
    },
    {
      pattern: /\/api\/atlas-cms\/deleteUser$/,
      handler: async (route) => {
        await route.fulfill({ json: successResponse(null) });
      },
    },
  ];

  for (const { pattern, handler } of handlers) {
    await page.route(pattern, handler);
  }
}

export async function setupFailedAuthMock(page: Page) {
  await page.route(/\/api\/atlas-cms\/login$/, async (route) => {
    await route.fulfill({ json: authFailedResponse() });
  });
  await page.route(/\/api\/atlas-cms\/getPageList/, async (route) => {
    await route.fulfill({ json: authFailedResponse() });
  });
}
