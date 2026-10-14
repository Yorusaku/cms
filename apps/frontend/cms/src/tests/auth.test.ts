import { beforeEach, describe, expect, it } from "vitest";
import {
  getCurrentRole,
  getEffectiveRole,
  hasAnyRole,
  isUserRole,
} from "@/utils/auth";
import router from "@/router";

/** 构造只带 payload 的伪 JWT（header/signature 不参与解析） */
const buildToken = (payload: Record<string, unknown>) => {
  const encoded = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${encoded}.signature`;
};

describe("utils/auth 角色判定", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("isUserRole 只接受 admin/editor/viewer", () => {
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("editor")).toBe(true);
    expect(isUserRole("viewer")).toBe(true);
    expect(isUserRole("owner")).toBe(false);
    expect(isUserRole("undefined")).toBe(false);
    expect(isUserRole(null)).toBe(false);
  });

  it("优先读取 localStorage.role", () => {
    localStorage.setItem("role", "editor");
    localStorage.setItem("token", buildToken({ role: "admin" }));
    expect(getCurrentRole()).toBe("editor");
  });

  it("localStorage 无有效角色时回退解析 JWT payload", () => {
    localStorage.setItem("token", buildToken({ sub: "u-1", role: "viewer" }));
    expect(getCurrentRole()).toBe("viewer");
  });

  it("localStorage 存了非法值（例如 undefined 字符串）时忽略并回退 JWT", () => {
    localStorage.setItem("role", "undefined");
    localStorage.setItem("token", buildToken({ role: "admin" }));
    expect(getCurrentRole()).toBe("admin");
  });

  it("两者都拿不到角色时返回 null，getEffectiveRole 降级为 viewer", () => {
    expect(getCurrentRole()).toBeNull();
    expect(getEffectiveRole()).toBe("viewer");

    localStorage.setItem("token", "not-a-jwt");
    expect(getCurrentRole()).toBeNull();
    expect(getEffectiveRole()).toBe("viewer");
  });

  it("hasAnyRole 在角色缺失或不在白名单时返回 false", () => {
    expect(hasAnyRole(["admin", "editor"])).toBe(false);

    localStorage.setItem("role", "viewer");
    expect(hasAnyRole(["admin", "editor"])).toBe(false);
    expect(hasAnyRole(["viewer"])).toBe(true);
  });
});

describe("路由角色矩阵", () => {
  const getMetaRoles = (path: string) => {
    const route = router.getRoutes().find((item) => item.path === path);
    expect(route, `未找到路由 ${path}`).toBeTruthy();
    return route?.meta?.roles as string[] | undefined;
  };

  it("/users 仅管理员可进", () => {
    expect(getMetaRoles("/users")).toEqual(["admin"]);
  });

  it("/decorate 仅管理员与编辑员可进，观察员不参与装修", () => {
    expect(getMetaRoles("/decorate")).toEqual(["admin", "editor"]);
  });

  it("活动列表与效果看板为只读页，不设路由级角色限制（页内再做写操作门禁）", () => {
    expect(getMetaRoles("/activity")).toBeUndefined();
    expect(getMetaRoles("/performance")).toBeUndefined();
  });
});
