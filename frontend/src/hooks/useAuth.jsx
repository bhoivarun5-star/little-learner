import { useState, useEffect, createContext, useContext } from 'react'
import authService from '../services/auth.service.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const login = async (email, password) => {
    const session = await authService.login(email, password)
    setUser({ id: session.userId, name: session.name, role: session.role, email: session.email })
    return session
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
