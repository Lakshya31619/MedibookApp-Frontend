import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as apiLogin, logout as apiLogout } from '../api/authService'

const AuthContext = createContext(null)

const TOKEN_KEY = 'medibook_token'
const USER_KEY  = 'medibook_user'

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(null)
  const [loading, setLoading] = useState(true)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    const savedUser  = localStorage.getItem(USER_KEY)
    if (savedToken && savedUser) {
      try {
        setToken(savedToken)
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }
    setLoading(false)
  }, [])

  const saveSession = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setToken(token)
    setUser(user)
  }, [])

  // Called after regular email/password login
  const login = useCallback(async (email, password) => {
    const res = await apiLogin({ email, password })
    const { token, user } = res.data
    saveSession(token, user)
    return user
  }, [saveSession])

  // Called from OAuth2 callback page with token from URL
  const loginWithToken = useCallback(async (token) => {
    // Decode JWT payload to get email + role (no sensitive data)
    const payload = JSON.parse(atob(token.split('.')[1]))
    // Fetch full profile — but we need userId. For OAuth2 we store minimal info
    // and let pages fetch the full profile as needed.
    const partialUser = {
      email: payload.sub,
      role:  payload.role,
    }
    saveSession(token, partialUser)
    return partialUser
  }, [saveSession])

  // Update user in state + localStorage (e.g. after profile update)
  const updateUser = useCallback((updatedUser) => {
    const merged = { ...user, ...updatedUser }
    localStorage.setItem(USER_KEY, JSON.stringify(merged))
    setUser(merged)
  }, [user])

  const logout = useCallback(async () => {
    try { await apiLogout() } catch { /* ignore */ }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const isAuthenticated = !!token && !!user
  const role = user?.role || null  // 'PATIENT' | 'PROVIDER' | 'ADMIN'

  return (
    <AuthContext.Provider value={{
      user, token, role, loading,
      isAuthenticated,
      login, loginWithToken, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
