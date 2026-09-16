// ─────────────────────────────────────────────
//  AuthContext — stores logged-in user globally
//  Wrap <App> with <AuthProvider> to use anywhere
// ─────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

// 1. Create the context
const AuthContext = createContext(null)

// 2. Provider component
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // logged-in user object
  const [loading, setLoading] = useState(true)   // true while checking session

  // Check session on first load
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Login — called from LoginPage
  async function login(mob, pass, role) {
    const res = await api.post('/auth/login', { mob, pass, role })
    if (res.data.success) setUser(res.data.user)
    return res.data
  }

  // Register — called from RegisterPage
  async function register(formData) {
    const res = await api.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  }

  // Logout
  async function logout() {
    await api.post('/auth/logout')
    setUser(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// 3. Hook — use anywhere: const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
