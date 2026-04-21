import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Stethoscope, Menu, X, LogOut, ChevronRight,
  LayoutDashboard, Users, Clock, Calendar,
  ClipboardList, Settings, ShieldCheck, Search,
  UserCheck, BarChart3
} from 'lucide-react'

const NAV_ITEMS = {
  PATIENT: [
    { label: 'Dashboard',       icon: LayoutDashboard, to: '/patient/dashboard' },
    { label: 'Find Doctors',    icon: Search,          to: '/patient/browse' },
    { label: 'My Appointments', icon: Calendar,        to: '/patient/appointments' },
  ],
  PROVIDER: [
    { label: 'Dashboard',       icon: LayoutDashboard, to: '/provider/dashboard' },
    { label: 'My Profile',      icon: Settings,        to: '/provider/profile' },
    { label: 'Manage Slots',    icon: Clock,           to: '/provider/slots' },
  ],
  ADMIN: [
    { label: 'Dashboard',       icon: LayoutDashboard, to: '/admin/dashboard' },
    { label: 'Pending Approvals', icon: UserCheck,     to: '/admin/pending' },
    { label: 'All Providers',   icon: Users,           to: '/admin/providers' },
  ],
}

const ROLE_BADGES = {
  PATIENT:  { label: 'Patient',  cls: 'bg-blue-100 text-blue-700' },
  PROVIDER: { label: 'Provider', cls: 'bg-emerald-100 text-emerald-700' },
  ADMIN:    { label: 'Admin',    cls: 'bg-violet-100 text-violet-700' },
}

export default function DashboardLayout({ children }) {
  const { user, role, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = NAV_ITEMS[role] || []
  const badge = ROLE_BADGES[role] || { label: role, cls: 'bg-slate-100 text-slate-700' }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const Sidebar = ({ mobile }) => (
    <aside className={`
      ${mobile ? 'flex' : 'hidden lg:flex'}
      flex-col h-full bg-navy-900 text-white
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-6 border-b border-navy-800">
        <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center">
          <Stethoscope className="h-4 w-4 text-white" />
        </div>
        <span className="font-serif text-lg">MediBook</span>
      </div>

      {/* User info */}
      <div className="px-6 py-4 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-navy-600 flex items-center justify-center text-sm font-semibold overflow-hidden flex-shrink-0">
            {user?.profilePicUrl
              ? <img src={user.profilePicUrl} alt="" className="h-full w-full object-cover" />
              : (user?.fullName?.charAt(0) || '?')
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.fullName || user?.email || 'User'}</p>
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => mobile && setMobileOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${active
                  ? 'bg-white/10 text-white'
                  : 'text-navy-300 hover:bg-white/5 hover:text-white'
                }
              `}
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{item.label}</span>
              {active && <ChevronRight className="h-4 w-4 ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-navy-800 pt-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-navy-300 hover:bg-white/5 hover:text-white transition-all duration-150"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 flex-shrink-0 flex flex-col">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden h-14 flex items-center gap-3 px-4 bg-white border-b border-slate-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-navy-700" />
            <span className="font-serif text-base text-navy-900">MediBook</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
