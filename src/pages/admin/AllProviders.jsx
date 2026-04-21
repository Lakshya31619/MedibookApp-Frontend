import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/Feedback'
import { adminGetAllProviders } from '../../api/providerService'
import { Search, Users, Eye, Star, CheckCircle, XCircle, Clock } from 'lucide-react'

const STATUS_FILTERS = ['All', 'APPROVED', 'PENDING', 'REJECTED']

function AllProvidersInner() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    adminGetAllProviders()
      .then(res => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = providers.filter(p => {
    const matchStatus = statusFilter === 'All' || p.verificationStatus === statusFilter
    const matchSearch = !search.trim() || [p.clinicName, p.specialization, p.qualification, p.clinicAddress]
      .filter(Boolean).some(f => f.toLowerCase().includes(search.toLowerCase()))
    return matchStatus && matchSearch
  })

  const StatusBadge = ({ status }) => {
    if (status === 'APPROVED') return <span className="badge-approved"><CheckCircle className="h-3 w-3" />Approved</span>
    if (status === 'REJECTED') return <span className="badge-rejected"><XCircle className="h-3 w-3" />Rejected</span>
    return <span className="badge-pending"><Clock className="h-3 w-3" />Pending</span>
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">All Providers</h1>
          <p className="page-subtitle">{providers.length} total registered providers</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, specialization…"
              className="input-field pl-9"
            />
          </div>
          <div className="flex gap-2">
            {STATUS_FILTERS.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s ? 'bg-navy-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-navy-300'
                }`}>
                {s === 'All' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No providers found" description="Try adjusting your filters." />
        ) : (
          <div className="card p-0 overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <div className="col-span-4">Provider</div>
              <div className="col-span-3">Specialization</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Rating</div>
              <div className="col-span-1">Fee</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            <div className="divide-y divide-slate-100">
              {filtered.map(p => (
                <div key={p.providerId} className="grid sm:grid-cols-12 gap-4 items-center px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Provider */}
                  <div className="sm:col-span-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white text-xs font-serif overflow-hidden flex-shrink-0">
                      {p.profilePicUrl ? <img src={p.profilePicUrl} alt="" className="h-full w-full object-cover" /> : p.clinicName?.slice(0,2) || 'DR'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{p.clinicName || 'Medical Clinic'}</p>
                      <p className="text-xs text-slate-400 truncate">{p.clinicAddress || '—'}</p>
                    </div>
                  </div>
                  {/* Spec */}
                  <div className="sm:col-span-3">
                    <p className="text-sm text-slate-600">{p.specialization}</p>
                    <p className="text-xs text-slate-400">{p.qualification}</p>
                  </div>
                  {/* Status */}
                  <div className="sm:col-span-2">
                    <StatusBadge status={p.verificationStatus} />
                    {!p.isAvailable && p.verificationStatus === 'APPROVED' && (
                      <p className="text-xs text-slate-400 mt-0.5">On leave</p>
                    )}
                  </div>
                  {/* Rating */}
                  <div className="sm:col-span-1 flex items-center gap-1 text-sm text-slate-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                    {p.avgRating > 0 ? p.avgRating.toFixed(1) : '—'}
                  </div>
                  {/* Fee */}
                  <div className="sm:col-span-1 text-sm text-slate-600">
                    {p.consultationFee > 0 ? `₹${p.consultationFee}` : '—'}
                  </div>
                  {/* Action */}
                  <div className="sm:col-span-1 flex sm:justify-end">
                    <Link to={`/admin/providers/${p.providerId}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-navy-600 hover:bg-navy-50 transition-colors">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function AllProviders() {
  return <ToastProvider><AllProvidersInner /></ToastProvider>
}
