import router from "@/router";
type UserRole = "admin" | "editor" | "viewer";

const whiteList = ["/login", "/404", "/401"];

/** admin-only 路由 */
const adminRoutes = ["/users"];

/** 获取当前用户角色 */
function getRole(): UserRole {
  return (localStorage.getItem("role") as UserRole) || "editor";
}

router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  if (token) {
    if (to.path === "/login") {
      return { path: "/home" };
    }

    // admin-only 路由守卫
    const role = getRole();
    if (adminRoutes.includes(to.path) && role !== "admin") {
      return { path: "/home" };
    }
  } else {
    if (whiteList.indexOf(to.path) === -1) {
      return { path: "/login", query: { redirect: to.fullPath } };
    }
  }
});