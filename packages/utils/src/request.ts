import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError
} from 'axios'

/**
 * 请求配置接口
 * @template T - 响应数据类型
 */
export interface RequestConfig extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
  skipAuth?: boolean
  onError?: (message: string) => void
}

/**
 * 响应数据接口
 * @template T - 数据类型
 */
export interface ResponseData<T = unknown> {
  code: number
  message: string
  data: T
}

/**
 * 自定义请求错误接口
 */
export interface CustomRequestError {
  message: string
  code?: number
  response?: AxiosResponse
}

/**
 * 错误显示函数类型
 */
export type ErrorDisplayFn = (message: string) => void

/**
 * HTTP 请求封装类
 * 提供统一的请求拦截、响应拦截、错误处理等功能
 *
 * @example
 * const request = new Request('/api')
 * const result = await request.get<UserInfo>('/user/info')
 */
class Request {
  private instance: AxiosInstance
  private loadingCount = 0
  private errorDisplayFn: ErrorDisplayFn | null = null

  /**
   * 构造函数
   * @param baseURL - API 基础路径
   * @param errorDisplayFn - 可选的错误显示函数，由调用方传入（如 ElMessage.error）
   */
  constructor(baseURL: string, errorDisplayFn?: ErrorDisplayFn) {
    this.instance = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (errorDisplayFn) {
      this.errorDisplayFn = errorDisplayFn
    }

    this.setupInterceptors()
  }

  /**
   * 设置错误显示函数
   * @param fn - 错误显示函数
   */
  public setErrorDisplay(fn: ErrorDisplayFn): void {
    this.errorDisplayFn = fn
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const requestConfig = config as RequestConfig
        // 显示 Loading
        if (requestConfig.showLoading) {
          this.showLoading()
        }
        // 添加 Token
        const token = this.getToken()
        if (token && !requestConfig.skipAuth) {
          config.headers['X-token'] = token
        }
        return config
      },
      (error: unknown) => {
        // 请求错误时隐藏 Loading
        if (this.loadingCount > 0) {
          this.hideLoading()
        }
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse<ResponseData>) => {
        const requestConfig = response.config as RequestConfig
        // 隐藏 Loading
        if (requestConfig.showLoading) {
          this.hideLoading()
        }

        const { data, status } = response

        // HTTP 状态码检查
        if (status !== 200) {
          const error: CustomRequestError = {
            message: '[Fetch]: 网络开了小差',
            code: status
          }
          if (requestConfig.showError) {
            this.showError(error.message)
          }
          return Promise.reject(error)
        }

        // 业务状态码检查
        if (data.code === 10000) {
          // 请求成功
          return response
        } else if (data.code === -2) {
          // 登录失效
          if (this.getCanToLoginStatus()) {
            this.toLogin()
          }
          const error: CustomRequestError = {
            message: data.message || '登录失效，请重新登录',
            code: data.code
          }
          if (requestConfig.showError) {
            this.showError(error.message)
          }
          return Promise.reject(error)
        } else {
          // 其他业务错误
          const error: CustomRequestError = {
            message: data.message || '请求失败',
            code: data.code
          }
          if (requestConfig.showError) {
            this.showError(error.message)
          }
          return Promise.reject(error)
        }
      },
      (error: unknown) => {
        // 响应错误处理
        if (this.loadingCount > 0) {
          this.hideLoading()
        }
        const errorMsg = this.getErrorMessage(error)
        const requestConfig = (error as any).config as RequestConfig | undefined
        if (requestConfig && requestConfig.showError) {
          this.showError(errorMsg)
        }
        return Promise.reject(error)
      }
    )
  }

  /**
   * 显示 Loading
   */
  private showLoading(): void {
    this.loadingCount++
  }

  /**
   * 隐藏 Loading
   */
  private hideLoading(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--
    }
  }

  /**
   * 获取 Token
   * @returns Token 字符串，不存在则返回 null
   */
  private getToken(): string | null {
    return localStorage.getItem('token')
  }

  /**
   * 获取是否可以跳转到登录页
   * @returns 是否允许跳转
   */
  private getCanToLoginStatus(): boolean {
    return true
  }

  /**
   * 跳转到登录页
   */
  private toLogin(): void {
    localStorage.removeItem('token')
    window.location.href = window.location.origin + '/cms-manage/#/login'
  }

  /**
   * 显示错误提示
   * @param message - 错误消息
   */
  private showError(message: string): void {
    if (this.errorDisplayFn) {
      this.errorDisplayFn(message)
    } else {
      // 默认使用 console.error
      console.error(message)
    }
  }

  /**
   * 获取错误消息
   * @param error - 错误对象
   * @returns 错误消息的字符串
   */
  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      if (axiosError.response) {
        return `请求失败：${axiosError.response.status}`
      } else if (axiosError.request) {
        return '网络异常，请稍后重试'
      } else {
        return axiosError.message || '未知错误'
      }
    }
    return '网络异常，请稍后重试'
  }

  /**
   * 通用请求方法
   * @template T - 响应数据类型
   * @param config - 请求配置
   * @returns Promise<ResponseData<T>>
   */
  public request<T = unknown>(config: RequestConfig): Promise<ResponseData<T>> {
    return this.instance.request<ResponseData<T>>(config).then(res => res.data)
  }

  /**
   * GET 请求
   * @template T - 响应数据类型
   * @param url - 请求地址
   * @param config - 请求配置
   * @returns Promise<ResponseData<T>>
   *
   * @example
   * const userInfo = await request.get<UserInfo>('/user/info')
   */
  public get<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.instance.get<ResponseData<T>>(url, config).then(res => res.data)
  }

  /**
   * POST 请求
   * @template T - 响应数据类型
   * @param url - 请求地址
   * @param data - 请求数据
   * @param config - 请求配置
   * @returns Promise<ResponseData<T>>
   *
   * @example
   * const result = await request.post('/user/login', { username, password })
   */
  public post<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.instance.post<ResponseData<T>>(url, data, config).then(res => res.data)
  }

  /**
   * PUT 请求
   * @template T - 响应数据类型
   * @param url - 请求地址
   * @param data - 请求数据
   * @param config - 请求配置
   * @returns Promise<ResponseData<T>>
   *
   * @example
   * const result = await request.put('/user/info', { name: '张三' })
   */
  public put<T = unknown>(
    url: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<ResponseData<T>> {
    return this.instance.put<ResponseData<T>>(url, data, config).then(res => res.data)
  }

  /**
   * DELETE 请求
   * @template T - 响应数据类型
   * @param url - 请求地址
   * @param config - 请求配置
   * @returns Promise<ResponseData<T>>
   *
   * @example
   * const result = await request.delete('/user/123')
   */
  public delete<T = unknown>(url: string, config?: RequestConfig): Promise<ResponseData<T>> {
    return this.instance.delete<ResponseData<T>>(url, config).then(res => res.data)
  }
}

export default Request
