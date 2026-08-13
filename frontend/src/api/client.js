import axios from 'axios'
import db from '../db/index.js'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({ baseURL: BASE_URL, timeout: 8000 })

// Attach JWT from IndexedDB on every request
api.interceptors.request.use(async (config) => {
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
          const res = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh: session.refreshToken })
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
