import { Request } from '@cms/utils'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const http = new Request(baseURL)

export default http
