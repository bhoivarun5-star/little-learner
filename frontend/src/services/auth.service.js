import db from '../db/index.js'
import api from '../api/client.js'

const SESSION_KEY = 'current'

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login/', { email, password })
    const { access, refresh, user } = res.data
    const session = {
      id: SESSION_KEY,
      accessToken: access,
      refreshToken: refresh,
      userId: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1h
    }
    await db.authSession.put(session)
    return session
  },

  async logout() {
    const session = await db.authSession.get(SESSION_KEY)
    try {
      if (session?.refreshToken) {
        await api.post('/auth/logout/', { refresh: session.refreshToken })
      }
    } catch { /* offline - still clear locally */ }
    await db.authSession.delete(SESSION_KEY)
    // Don't clear child progress - it stays on device
  },

  async getSession() {
    return await db.authSession.get(SESSION_KEY)
  },

  async isAuthenticated() {
    const session = await db.authSession.get(SESSION_KEY)
    return !!session?.accessToken
  },

  async getCurrentUser() {
    const session = await db.authSession.get(SESSION_KEY)
    if (!session) return null
    return { id: session.userId, name: session.name, role: session.role, email: session.email }
  },
}

export default authService
