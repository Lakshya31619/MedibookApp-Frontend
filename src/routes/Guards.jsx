import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/common/Spinner'

// Requires authentication — redirects to /login if not logged in
export function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner full />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// Requires a specific role
export function RoleRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Spinner full />
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />
  if (!roles.includes(role)) return <Navigate to="/unauthorized" replace />
  return children
}

// Redirect logged-in users away from /login and /register
export function GuestRoute({ children }) {
  const { isAuthenticated, role, loading } = useAuth()
  if (loading) return <Spinner full />
  if (isAuthenticated) return <Navigate to={getDashboard(role)} replace />
  return children
}

export function getDashboard(role) {
  if (role === 'ADMIN')    return '/admin/dashboard'
  if (role === 'PROVIDER') return '/provider/dashboard'
  return '/patient/dashboard'
}
