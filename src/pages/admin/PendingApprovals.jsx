import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/Feedback'
import { adminGetPendingProviders, verifyProvider, rejectProvider } from '../../api/providerService'
import { CheckCircle, XCircle, Eye, Clock, MapPin, GraduationCap, X } from 'lucide-react'

function RejectModal({ provider, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  if (!provider) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-card-hover max-w-md w-full p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-900">Reject Provider</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Rejecting <strong className="text-slate-700">{provider.clinicName || 'this provider'}</strong>. Please give a reason so they can improve their application.
        </p>
        <textarea
          rows={3}
          className="input-field resize-none mb-4"
          placeholder="e.g. Qualification documents are incomplete. Please upload a valid MBBS certificate."
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()) }}
            disabled={!reason.trim() || loading}
            className="btn-danger"
          >
            {loading ? 'Rejecting…' : 'Reject Provider'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PendingApprovalsInner() {
  const toast = useToast()
  const [providers, setProviders] = useState([])
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectLoading, setRejectLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    adminGetPendingProviders()
      .then(res => setProviders(res.data))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id, name) => {
    setActionId(id)
    try {
      await verifyProvider(id)
      toast.success(`${name || 'Provider'} approved!`)
      setProviders(p => p.filter(x => x.providerId !== id))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Approval failed.')
    } finally { setActionId(null) }
  }

  const handleReject = async (reason) => {
    if (!rejectTarget) return
    setRejectLoading(true)
    try {
      await rejectProvider(rejectTarget.providerId, reason)
      toast.success('Provider rejected.')
      setProviders(p => p.filter(x => x.providerId !== rejectTarget.providerId))
      setRejectTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Rejection failed.')
    } finally { setRejectLoading(false) }
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Pending Approvals</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${providers.length} provider${providers.length !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="All caught up!"
            description="No providers are waiting for review right now."
          />
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {providers.map(p => (
              <div key={p.providerId} className="card flex flex-col">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-base overflow-hidden flex-shrink-0">
                    {p.profilePicUrl ? <img src={p.profilePicUrl} alt="" className="h-full w-full object-cover" /> : p.clinicName?.slice(0,2) || 'DR'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{p.clinicName || 'Medical Clinic'}</p>
                    <p className="text-sm text-emerald-600 font-medium">{p.specialization}</p>
                    <span className="badge-pending mt-1">Pending</span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-500 mb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{p.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{p.experienceYears} years experience</span>
                  </div>
                  {p.clinicAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{p.clinicAddress}</span>
                    </div>
                  )}
                  {p.bio && (
                    <p className="line-clamp-2 text-slate-400 italic border-t border-slate-100 pt-2">{p.bio}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-slate-100 pt-4">
                  <Link to={`/admin/providers/${p.providerId}`}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <button
                    onClick={() => handleApprove(p.providerId, p.clinicName)}
                    disabled={actionId === p.providerId}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    {actionId === p.providerId ? '…' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setRejectTarget(p)}
                    disabled={actionId === p.providerId}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RejectModal
        provider={rejectTarget}
        onConfirm={handleReject}
        onClose={() => setRejectTarget(null)}
        loading={rejectLoading}
      />
    </DashboardLayout>
  )
}

export default function PendingApprovals() {
  return <ToastProvider><PendingApprovalsInner /></ToastProvider>
}
