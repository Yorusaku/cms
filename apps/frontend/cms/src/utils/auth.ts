export type UserRole = "admin" | "editor" | "viewer";

const USER_ROLES: UserRole[] = ["admin", "editor", "viewer"];

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);

const decodePayload = (token: string | null): Record<string, unknown> | null => {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const getCurrentRole = (): UserRole | null => {
  const stored = localStorage.getItem("role");
  if (isUserRole(stored)) return stored;
  const payload = decodePayload(localStorage.getItem("token"));
  return isUserRole(payload?.role) ? payload.role : null;
};

export const hasAnyRole = (roles: UserRole[]): boolean => {
  const role = getCurrentRole();
  return role !== null && roles.includes(role);
};

/**
 * 取当前生效角色：localStorage.role 优先，JWT payload 兜底。
 * 两者都识别不出时按 viewer（最小权限）处理，避免前端越权展示写操作入口。
 * 注意：前端门禁只负责隐藏入口，最终鉴权仍以后端 @Roles 为准。
 */
export const getEffectiveRole = (): UserRole => getCurrentRole() ?? "viewer";