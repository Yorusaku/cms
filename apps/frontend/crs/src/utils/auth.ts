/**
 * CRS 端登录态。
 *
 * CMS 与 CRS 不同端口即不同 origin，localStorage 天然隔离：
 * 这里只读写本站的 token，不假设与 CMS 共享登录。
 */
export const TOKEN_KEY = 'token'

export interface CrsUser {
  username: string
  role: string
}

export const getToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * 解析 JWT 载荷里的用户名与角色。
 *
 * 只用于界面展示（决定显示哪些操作按钮）；权限判定始终由后端完成，
 * 这里不验签、也不作为授权依据。
 */
export const parseTokenUser = (): CrsUser | null => {
  const token = getToken()
  const payloadPart = token.split('.')[1]
  if (!payloadPart) {
    return null
  }
  try {
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    )
    const payload = JSON.parse(json) as { username?: string; role?: string }
    if (!payload.username || !payload.role) {
      return null
    }
    return { username: payload.username, role: payload.role }
  } catch {
    return null
  }
}

export const isTokenExpired = (): boolean => {
  const token = getToken()
  const payloadPart = token.split('.')[1]
  if (!payloadPart) {
    return true
  }
  try {
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    if (!payload.exp) {
      return false
    }
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

export const isLoggedIn = (): boolean => Boolean(getToken()) && !isTokenExpired()

/** 当前站内路径，登录后回跳用 */
export const currentPath = (): string => `${window.location.hash.replace(/^#/, '') || '/'}`

/**
 * 只允许站内返回地址：必须以单个 `/` 开头，拒绝 `//host`、`http(s)://` 与反斜杠。
 */
export const resolveRedirect = (raw: unknown, fallback = '/'): string => {
  if (typeof raw !== 'string' || !raw) {
    return fallback
  }
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes('://') || raw.includes('\\')) {
    return fallback
  }
  return raw
}
