import { Request } from '@cms/utils'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

/**
 * 登录失效时跳本站登录页。
 *
 * 不配置的话 `Request` 会兜底跳到 `/cms-manage/#/login` —— CMS 的地址，
 * 在 CRS 端口上只会得到 404（两端部署在不同端口，不能共享登录页）。
 */
const http = new Request({
  baseURL,
  loginRedirectFn: () => {
    const redirect = window.location.hash.replace(/^#/, '') || '/'
    if (redirect.startsWith('/login')) {
      return
    }
    window.location.hash = `#/login?redirect=${encodeURIComponent(redirect)}`
  }
})

export default http
