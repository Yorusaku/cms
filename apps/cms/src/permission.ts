import router from './router'

const whiteList = ['/login', '/404', '/401']

router.beforeEach(to => {
  const token = localStorage.getItem('token')

  if (token) {
    if (to.path === '/login') {
      return { path: '/home' }
    }
  } else {
    if (whiteList.indexOf(to.path) === -1) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }
})
