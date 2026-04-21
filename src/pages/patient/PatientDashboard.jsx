import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider } from '../../components/common/Toast'
import { useAuth } from '../../context/AuthContext'
import { getVerifiedProviders } from '../../api/providerService'
import { Search, Calendar, Clock, ArrowRight, User } from 'lucide-react'

function PatientDashboardInner() {
  const { user } = useAuth()
  const [topProviders, setTopProviders] = useState([])

  useEffect(() => {
    getVerifiedProviders()
      .then(res => setTopProviders(res.data.slice(0, 3)))
      .catch(() => {})
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        {/* Welcome */}
        <div className="page-header">
          <h1 className="page-title">{greeting}, {firstName}.</h1>
          <p className="page-subtitle">How can we help you today?</p>
        </div>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Find a Doctor',      icon: Search,       to: '/patient/browse',       cls: 'bg-navy-700 text-white', iconCls: 'text-navy-200' },
            { label: 'My Appointments',    icon: Calendar,     to: '/patient/appointments', cls: 'bg-white border border-slate-200', iconCls: 'text-navy-600' },
            { label: 'Browse Specialties', icon: Clock,        to: '/providers',            cls: 'bg-white border border-slate-200', iconCls: 'text-navy-600' },
          ].map(a => (
            <Link key={a.label} to={a.to}
              className={`${a.cls} rounded-xl p-5 flex items-center justify-between group hover:shadow-card-hover transition-all duration-200`}>
              <span className={`font-medium text-sm ${a.cls.includes('navy-700') ? 'text-white' : 'text-slate-700'}`}>{a.label}</span>
              <a.icon className={`h-5 w-5 ${a.iconCls}`} />
            </Link>
          ))}
        </div>

        {/* Featured providers */}
        {topProviders.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-lg text-navy-900">Featured Doctors</h2>
              <Link to="/patient/browse" className="text-sm text-navy-600 hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {topProviders.map(p => (
                <Link key={p.providerId} to={`/providers/${p.providerId}`}
                  className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white text-sm font-serif flex-shrink-0 overflow-hidden">
                    {p.profilePicUrl ? <img src={p.profilePicUrl} alt="" className="h-full w-full object-cover" /> : (p.clinicName?.slice(0,2) || 'DR')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.clinicName || 'Medical Clinic'}</p>
                    <p className="text-xs text-emerald-600">{p.specialization}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.consultationFee > 0 && <p className="text-sm font-semibold text-navy-700">₹{p.consultationFee}</p>}
                    <p className={`text-xs font-medium ${p.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {p.isAvailable ? 'Available' : 'On leave'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Profile card */}
        <div className="card">
          <h2 className="font-serif text-lg text-navy-900 mb-4">My Profile</h2>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-navy-100 flex items-center justify-center overflow-hidden">
              {user?.profilePicUrl
                ? <img src={user.profilePicUrl} alt="" className="h-full w-full object-cover" />
                : <User className="h-6 w-6 text-navy-500" />
              }
            </div>
            <div>
              <p className="font-medium text-slate-900">{user?.fullName}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              {user?.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function PatientDashboard() {
  return <ToastProvider><PatientDashboardInner /></ToastProvider>
}
