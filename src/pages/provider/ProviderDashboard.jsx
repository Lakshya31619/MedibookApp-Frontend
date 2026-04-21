import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { useAuth } from '../../context/AuthContext'
import { getMyProviderProfile } from '../../api/providerService'
import { countAvailableSlots } from '../../api/scheduleService'
import {
  Clock, CheckCircle, XCircle, AlertCircle, ArrowRight,
  CalendarPlus, Settings, BarChart3, ShieldCheck
} from 'lucide-react'

function StatusBanner({ status, reason }) {
  if (status === 'APPROVED') return (
    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
      <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-emerald-800">Profile Approved</p>
        <p className="text-xs text-emerald-600 mt-0.5">You can now add slots and accept appointments.</p>
      </div>
    </div>
  )
  if (status === 'PENDING') return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">Awaiting Admin Approval</p>
        <p className="text-xs text-amber-600 mt-0.5">Your profile has been submitted and is under review. You'll be notified once approved.</p>
      </div>
    </div>
  )
  if (status === 'REJECTED') return (
    <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-800">Profile Rejected</p>
        {reason && <p className="text-xs text-red-600 mt-0.5"><strong>Reason:</strong> {reason}</p>}
        <p className="text-xs text-red-600 mt-1">Please update your profile and contact support for re-review.</p>
      </div>
    </div>
  )
  return null
}

function ProviderDashboardInner() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile]     = useState(null)
  const [slotCount, setSlotCount] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [noProfile, setNoProfile] = useState(false)

  useEffect(() => {
    if (!user?.userId) return
    getMyProviderProfile(user.userId)
      .then(async res => {
        const p = res.data
        setProfile(p)
        if (p.verificationStatus === 'APPROVED') {
          try {
            const sc = await countAvailableSlots(p.providerId)
            setSlotCount(sc.data.availableSlots)
          } catch {}
        }
      })
      .catch(err => {
        if (err.response?.status === 404) setNoProfile(true)
      })
      .finally(() => setLoading(false))
  }, [user])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-6">
        <div className="page-header">
          <h1 className="page-title">{greeting}, {user?.fullName?.split(' ')[0] || 'Doctor'}.</h1>
          <p className="page-subtitle">Manage your practice and availability</p>
        </div>

        {/* No profile yet */}
        {noProfile && (
          <div className="card border-navy-200 bg-navy-50">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-navy-700 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-base text-navy-900 mb-1">Complete your doctor profile</h3>
                <p className="text-sm text-slate-500 mb-4">Set up your profile to get verified and start accepting patients.</p>
                <Link to="/provider/setup" className="btn-primary text-sm inline-flex items-center gap-2">
                  Set Up Profile <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Status banner */}
        {profile && <StatusBanner status={profile.verificationStatus} reason={profile.rejectionReason} />}

        {/* Stats — only show when approved */}
        {profile?.verificationStatus === 'APPROVED' && (
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="card">
              <p className="section-label">Available Slots</p>
              <p className="font-serif text-3xl text-navy-900">{slotCount ?? '—'}</p>
              <p className="text-xs text-slate-400 mt-1">open for booking</p>
            </div>
            <div className="card">
              <p className="section-label">Availability</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${profile.isAvailable ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="font-serif text-lg text-navy-900">
                  {profile.isAvailable ? 'Accepting Patients' : 'On Leave'}
                </span>
              </div>
            </div>
            <div className="card">
              <p className="section-label">Rating</p>
              <p className="font-serif text-3xl text-navy-900">
                {profile.avgRating > 0 ? profile.avgRating.toFixed(1) : 'New'}
              </p>
              <p className="text-xs text-slate-400 mt-1">average rating</p>
            </div>
          </div>
        )}

        {/* Quick actions */}
        {profile?.verificationStatus === 'APPROVED' && (
          <div className="card">
            <h2 className="font-serif text-lg text-navy-900 mb-4">Quick Actions</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'Add Slots',       icon: CalendarPlus, to: '/provider/slots',   desc: 'Create new availability' },
                { label: 'Edit Profile',    icon: Settings,     to: '/provider/profile',  desc: 'Update your details' },
              ].map(a => (
                <Link key={a.label} to={a.to}
                  className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:border-navy-300 hover:bg-navy-50 transition-all duration-200">
                  <div className="h-9 w-9 rounded-lg bg-navy-700 flex items-center justify-center flex-shrink-0">
                    <a.icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.label}</p>
                    <p className="text-xs text-slate-400">{a.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Profile summary if exists */}
        {profile && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg text-navy-900">My Profile</h2>
              <Link to="/provider/profile" className="text-sm text-navy-600 hover:underline">Edit</Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Specialization', profile.specialization],
                ['Qualification',  profile.qualification],
                ['Experience',     `${profile.experienceYears} years`],
                ['Clinic',         profile.clinicName || '—'],
                ['Location',       profile.clinicAddress || '—'],
                ['Fee',            profile.consultationFee > 0 ? `₹${profile.consultationFee}` : 'Not set'],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-slate-400 font-medium">{k}</p>
                  <p className="text-slate-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function ProviderDashboard() {
  return <ToastProvider><ProviderDashboardInner /></ToastProvider>
}
