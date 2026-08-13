import axios from 'axios'
import db from '../db/index.js'

let rawBase = import.meta.env.VITE_API_BASE_URL || '/api'
const BASE_URL = rawBase.replace(/\/+$/, '')

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 })

// Attach JWT from IndexedDB & ensure URL path joining doesn't strip base path
api.interceptors.request.use(async (config) => {
  if (config.url && config.url.startsWith('/') && BASE_URL.includes('/')) {
    const baseOriginAndPath = BASE_URL.replace(/\/+$/, '')
    const endpointPath = config.url.replace(/^\/+/, '')
    config.url = `${baseOriginAndPath}/${endpointPath}`
  }

  const session = await db.authSession.get('current')
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

// On 401 attempt silent token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const session = await db.authSession.get('current')
        if (session?.refreshToken) {
          const refreshUrl = `${BASE_URL.replace(/\/+$/, '')}/auth/refresh/`
          const res = await axios.post(refreshUrl, { refresh: session.refreshToken })
          const newAccess = res.data.access
          await db.authSession.update('current', { accessToken: newAccess })
          original.headers.Authorization = `Bearer ${newAccess}`
          return api(original)
        }
      } catch {
        // Refresh failed - user needs to log in again when online
      }
    }
    return Promise.reject(error)
  }
)

export default api
