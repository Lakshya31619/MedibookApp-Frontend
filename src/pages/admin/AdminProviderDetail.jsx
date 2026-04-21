import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { ErrorMessage } from '../../components/common/Feedback'
import ConfirmModal from '../../components/common/ConfirmModal'
import { getProviderById, verifyProvider, rejectProvider, unverifyProvider, deleteProvider } from '../../api/providerService'
import {
  ArrowLeft, CheckCircle, XCircle, Clock, Star, MapPin,
  GraduationCap, Stethoscope, IndianRupee, RefreshCw, Trash2, X
} from 'lucide-react'

function RejectModal({ open, onConfirm, onClose, loading }) {
  const [reason, setReason] = useState('')
  useEffect(() => { if (!open) setReason('') }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-card-hover max-w-md w-full p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg text-slate-900">Reject Provider</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Provide a clear reason so the provider can address the issue.</p>
        <textarea rows={4} className="input-field resize-none mb-4" placeholder="e.g. Registration number not provided. Please resubmit with valid medical council ID."
          value={reason} onChange={e => setReason(e.target.value)} />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading} className="btn-danger">
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminProviderDetailInner() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const toast    = useToast()

  const [provider, setProvider]       = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [showReject, setShowReject]   = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [deleting, setDeleting]       = useState(false)

  const load = () => {
    setLoading(true)
    getProviderById(id)
      .then(res => setProvider(res.data))
      .catch(err => setError(err.response?.data?.error || 'Provider not found.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await verifyProvider(id)
      toast.success('Provider approved.')
      setProvider(p => ({...p, verificationStatus: 'APPROVED', isVerified: true, rejectionReason: null}))
    } catch (err) { toast.error(err.response?.data?.error || 'Approval failed.') }
    finally { setActionLoading(false) }
  }

  const handleReject = async (reason) => {
    setActionLoading(true)
    try {
      await rejectProvider(id, reason)
      toast.success('Provider rejected.')
      setProvider(p => ({...p, verificationStatus: 'REJECTED', isVerified: false, rejectionReason: reason}))
      setShowReject(false)
    } catch (err) { toast.error(err.response?.data?.error || 'Rejection failed.') }
    finally { setActionLoading(false) }
  }

  const handleReset = async () => {
    setActionLoading(true)
    try {
      await unverifyProvider(id)
      toast.success('Provider reset to Pending.')
      setProvider(p => ({...p, verificationStatus: 'PENDING', isVerified: false}))
    } catch (err) { toast.error(err.response?.data?.error || 'Reset failed.') }
    finally { setActionLoading(false) }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProvider(id)
      toast.success('Provider deleted.')
      navigate('/admin/providers', { replace: true })
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed.') }
    finally { setDeleting(false) }
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>
  if (error)   return <DashboardLayout><div className="max-w-md"><ErrorMessage message={error} /></div></DashboardLayout>

  const status = provider.verificationStatus
  const StatusBadge = () => {
    if (status === 'APPROVED') return <span className="badge-approved text-sm px-3 py-1.5"><CheckCircle className="h-4 w-4" />Approved</span>
    if (status === 'REJECTED') return <span className="badge-rejected text-sm px-3 py-1.5"><XCircle className="h-4 w-4" />Rejected</span>
    return <span className="badge-pending text-sm px-3 py-1.5"><Clock className="h-4 w-4" />Pending Review</span>
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header card */}
        <div className="card mb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-xl overflow-hidden flex-shrink-0">
                {provider.profilePicUrl ? <img src={provider.profilePicUrl} alt="" className="h-full w-full object-cover" /> : provider.clinicName?.slice(0,2) || 'DR'}
              </div>
              <div>
                <h1 className="font-serif text-2xl text-navy-900">{provider.clinicName || 'Medical Clinic'}</h1>
                <p className="text-emerald-600 font-medium">{provider.specialization}</p>
                <p className="text-sm text-slate-500 mt-0.5">Provider ID: #{provider.providerId} · User ID: #{provider.userId}</p>
              </div>
            </div>
            <StatusBadge />
          </div>

          {/* Rejection reason */}
          {status === 'REJECTED' && provider.rejectionReason && (
            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-600">{provider.rejectionReason}</p>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          {/* Professional details */}
          <div className="card">
            <h2 className="font-serif text-base text-navy-900 mb-4">Professional Details</h2>
            <div className="space-y-3">
              {[
                { icon: GraduationCap, label: 'Qualification',  val: provider.qualification },
                { icon: Stethoscope,   label: 'Specialization', val: provider.specialization },
                { icon: Clock,         label: 'Experience',     val: `${provider.experienceYears} years` },
                { icon: Star,          label: 'Rating',         val: provider.avgRating > 0 ? provider.avgRating.toFixed(1) : 'Not rated' },
                { icon: IndianRupee,   label: 'Consultation Fee', val: provider.consultationFee > 0 ? `₹${provider.consultationFee}` : 'Not set' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <item.icon className="h-4 w-4 text-navy-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm text-slate-700">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinic details */}
          <div className="card">
            <h2 className="font-serif text-base text-navy-900 mb-4">Clinic Information</h2>
            <div className="space-y-3">
              {provider.clinicAddress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-navy-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Address</p>
                    <p className="text-sm text-slate-700">{provider.clinicAddress}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-400 mb-1">Availability</p>
                <span className={`text-sm font-medium ${provider.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {provider.isAvailable ? 'Currently accepting patients' : 'On leave'}
                </span>
              </div>
              {provider.bio && (
                <div>
                  <p className="text-xs text-slate-400 mb-1">Bio</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{provider.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="card">
          <h2 className="font-serif text-base text-navy-900 mb-4">Admin Actions</h2>
          <div className="flex flex-wrap gap-3">
            {status !== 'APPROVED' && (
              <button onClick={handleApprove} disabled={actionLoading}
                className="btn-success flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" />
                {actionLoading ? 'Approving…' : 'Approve Provider'}
              </button>
            )}
            {status !== 'REJECTED' && (
              <button onClick={() => setShowReject(true)} disabled={actionLoading}
                className="btn-danger flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4" />
                Reject Provider
              </button>
            )}
            {status !== 'PENDING' && (
              <button onClick={handleReset} disabled={actionLoading}
                className="btn-secondary flex items-center gap-2 text-sm">
                <RefreshCw className="h-4 w-4" />
                {actionLoading ? 'Resetting…' : 'Reset to Pending'}
              </button>
            )}
            <button onClick={() => setShowDelete(true)}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors">
              <Trash2 className="h-4 w-4" /> Delete Provider
            </button>
          </div>
        </div>
      </div>

      <RejectModal
        open={showReject}
        onConfirm={handleReject}
        onClose={() => setShowReject(false)}
        loading={actionLoading}
      />
      <ConfirmModal
        isOpen={showDelete}
        title="Delete provider?"
        message="This action is irreversible. All provider data will be permanently removed."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        confirmLabel="Delete Permanently"
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default function AdminProviderDetail() {
  return <ToastProvider><AdminProviderDetailInner /></ToastProvider>
}
