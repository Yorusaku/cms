import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '活动列表'
    }
  },
  {
    path: '/pagePreview',
    name: 'PagePreview',
    component: () => import('../views/PagePreview.vue'),
    meta: {
      title: '预览页'
    }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
