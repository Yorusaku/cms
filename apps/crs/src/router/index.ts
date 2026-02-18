import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/page',
    name: 'Page',
    component: () => import('../views/Page.vue'),
    meta: {
      title: '配置页'
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
  {
    path: '/activity',
    name: 'Activity',
    component: () => import('../views/Activity.vue'),
    meta: {
      title: '活动页'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
