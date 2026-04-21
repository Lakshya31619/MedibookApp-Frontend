import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { adminGetAllProviders, adminGetPendingProviders, getSpecializationStats } from '../../api/providerService'
import { getAdminUsers } from '../../api/authService'
import { Users, UserCheck, Clock, BarChart3, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

function StatCard({ label, value, icon: Icon, sub, color = 'navy' }) {
  const colors = {
    navy:    'bg-navy-700 text-white',
    emerald: 'bg-emerald-500 text-white',
    amber:   'bg-amber-500 text-white',
    red:     'bg-red-500 text-white',
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="section-label">{label}</p>
        <p className="font-serif text-3xl text-navy-900 leading-none mt-1">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

function AdminDashboardInner() {
  const [allProviders, setAllProviders]     = useState([])
  const [pendingProviders, setPendingProviders] = useState([])
  const [specs, setSpecs]                   = useState([])
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    Promise.allSettled([
      adminGetAllProviders(),
      adminGetPendingProviders(),
      getSpecializationStats(),
    ]).then(([all, pending, specRes]) => {
      if (all.status === 'fulfilled')     setAllProviders(all.value.data)
      if (pending.status === 'fulfilled') setPendingProviders(pending.value.data)
      if (specRes.status === 'fulfilled') setSpecs(specRes.value.data)
    }).finally(() => setLoading(false))
  }, [])

  const approved  = allProviders.filter(p => p.verificationStatus === 'APPROVED')
  const rejected  = allProviders.filter(p => p.verificationStatus === 'REJECTED')
  const available = approved.filter(p => p.isAvailable)

  const maxCount = specs.length ? Math.max(...specs.map(s => s.count)) : 1

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview and management</p>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Providers"   value={allProviders.length}     icon={Users}      color="navy" />
          <StatCard label="Approved Doctors"  value={approved.length}         icon={CheckCircle} color="emerald" />
          <StatCard label="Pending Review"    value={pendingProviders.length} icon={Clock}       color="amber" sub={pendingProviders.length ? 'Needs attention' : 'All clear'} />
          <StatCard label="Available Now"     value={available.length}        icon={UserCheck}   color="navy" />
        </div>

        {/* Pending queue preview */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg text-navy-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Pending Approvals
              {pendingProviders.length > 0 && (
                <span className="ml-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">
                  {pendingProviders.length}
                </span>
              )}
            </h2>
            <Link to="/admin/pending" className="text-sm text-navy-600 hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {pendingProviders.length === 0 ? (
            <div className="flex items-center gap-3 py-4 text-sm text-emerald-600">
              <CheckCircle className="h-5 w-5" />
              No pending approvals. All caught up!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingProviders.slice(0, 5).map(p => (
                <Link key={p.providerId} to={`/admin/providers/${p.providerId}`}
                  className="flex items-center gap-4 py-3.5 first:pt-0 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white text-xs font-serif overflow-hidden flex-shrink-0">
                    {p.profilePicUrl ? <img src={p.profilePicUrl} alt="" className="h-full w-full object-cover" /> : p.clinicName?.slice(0,2) || 'DR'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{p.clinicName || 'Medical Clinic'}</p>
                    <p className="text-xs text-slate-400">{p.specialization} · {p.experienceYears}y exp</p>
                  </div>
                  <span className="badge-pending flex-shrink-0">Pending</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Specialization bar chart */}
        {specs.length > 0 && (
          <div className="card">
            <h2 className="font-serif text-lg text-navy-900 mb-5 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-navy-500" />
              Providers by Specialization
            </h2>
            <div className="space-y-3">
              {[...specs].sort((a,b) => b.count - a.count).slice(0, 10).map(s => (
                <div key={s.specialization} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-32 flex-shrink-0 truncate">{s.specialization}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-navy-600 rounded-full transition-all duration-500"
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-navy-700 w-6 text-right flex-shrink-0">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status breakdown */}
        <div className="card">
          <h2 className="font-serif text-lg text-navy-900 mb-5">Provider Status Breakdown</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: 'Approved', count: approved.length,            cls: 'text-emerald-600', bar: 'bg-emerald-500' },
              { label: 'Pending',  count: pendingProviders.length,    cls: 'text-amber-600',   bar: 'bg-amber-500' },
              { label: 'Rejected', count: rejected.length,            cls: 'text-red-600',     bar: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="text-center p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className={`font-serif text-3xl ${item.cls}`}>{item.count}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{item.label}</p>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className={`h-full ${item.bar} rounded-full`}
                    style={{ width: allProviders.length ? `${(item.count / allProviders.length) * 100}%` : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function AdminDashboard() {
  return <ToastProvider><AdminDashboardInner /></ToastProvider>
}
