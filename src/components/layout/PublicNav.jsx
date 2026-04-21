import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboard } from '../../routes/Guards'
import { Menu, X, Stethoscope } from 'lucide-react'

export default function PublicNav() {
  const { isAuthenticated, role, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-navy-700 flex items-center justify-center">
            <Stethoscope className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="font-serif text-xl text-navy-900">MediBook</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/providers" className="text-sm text-slate-600 hover:text-navy-700 font-medium transition-colors">
            Find Doctors
          </Link>
          {isAuthenticated ? (
            <>
              <Link to={getDashboard(role)} className="text-sm text-slate-600 hover:text-navy-700 font-medium transition-colors">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="text-sm text-slate-600 hover:text-navy-700 font-medium transition-colors">Sign In</Link>
              <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-2">
          <Link to="/providers" className="block py-2 text-sm text-slate-700" onClick={() => setOpen(false)}>Find Doctors</Link>
          {isAuthenticated ? (
            <>
              <Link to={getDashboard(role)} className="block py-2 text-sm text-slate-700" onClick={() => setOpen(false)}>Dashboard</Link>
              <button onClick={() => { setOpen(false); handleLogout() }} className="block w-full text-left py-2 text-sm text-slate-700">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login"    className="block py-2 text-sm text-slate-700" onClick={() => setOpen(false)}>Sign In</Link>
              <Link to="/register" className="block py-2 text-sm font-semibold text-navy-700" onClick={() => setOpen(false)}>Get Started</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
