import router from "@/router";
import { getCurrentRole, type UserRole } from "@/utils/auth";

const whiteList = ["/login", "/404", "/401"];

router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  if (!token) {
    if (whiteList.indexOf(to.path) === -1) {
      return { path: "/login", query: { redirect: to.fullPath } };
    }
    return;
  }

  if (to.path === "/login") {
    return { path: "/home" };
  }

  // 路由级角色门禁：meta.roles 缺省表示任意已登录角色可访问（只读页）
  const allowedRoles = to.meta?.roles as UserRole[] | undefined;
  if (allowedRoles && allowedRoles.length > 0) {
    const role = getCurrentRole();
    if (!role || !allowedRoles.includes(role)) {
      return { path: "/activity" };
    }
  }
});
