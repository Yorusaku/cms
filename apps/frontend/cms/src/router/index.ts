import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import type { UserRole } from "@/utils/auth";

/**
 * 路由角色矩阵（与后端 @Roles 保持一致）：
 * - 不写 meta.roles 表示任意已登录角色均可访问（viewer 只读页）。
 * - /decorate 只对 admin/editor 开放，viewer 不参与装修。
 * - /users 仅 admin。
 */
const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    redirect: "/home",
  },
  {
    path: "/home",
    name: "Home",
    component: () => import("@/views/Home.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
  },
  {
    path: "/decorate",
    name: "Decorate",
    component: () => import("@/views/Decorate/index.vue"),
    meta: { roles: ["admin", "editor"] as UserRole[] },
  },
  {
    path: "/preview",
    name: "Preview",
    component: () => import("@/views/Preview.vue"),
  },
  {
    path: "/activity",
    name: "Activity",
    component: () => import("@/views/Activity.vue"),
  },
  {
    path: "/performance",
    name: "Performance",
    component: () => import("@/views/Performance.vue"),
  },
  {
    path: "/users",
    name: "Users",
    component: () => import("@/views/Users.vue"),
    meta: { roles: ["admin"] as UserRole[] },
  },
  {
    path: "/404",
    name: "404",
    component: () => import("@/views/404.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
