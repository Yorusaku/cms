import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '页面列表'
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
    path: '/page',
    name: 'Page',
    component: () => import('../views/Page.vue'),
    meta: {
      title: '业务页面'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '业务登录'
    }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('../views/Notifications.vue'),
    meta: {
      title: '消息'
    }
  },
  {
    path: '/myTickets',
    name: 'MyTickets',
    component: () => import('../views/MyTickets.vue'),
    meta: {
      title: '我的记录'
    }
  },
  {
    path: '/ticketException',
    name: 'TicketExceptionDetail',
    component: () => import('../views/TicketExceptionDetail.vue'),
    meta: {
      title: '异常详情'
    }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
