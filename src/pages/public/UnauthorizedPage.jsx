import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboard } from '../../routes/Guards'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  const { isAuthenticated, role } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-5">
          <ShieldX className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="font-serif text-2xl text-slate-900 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 mb-7">You don't have permission to view this page.</p>
        {isAuthenticated
          ? <Link to={getDashboard(role)} className="btn-primary inline-block">Go to Dashboard</Link>
          : <Link to="/login" className="btn-primary inline-block">Sign In</Link>
        }
      </div>
    </div>
  )
}
