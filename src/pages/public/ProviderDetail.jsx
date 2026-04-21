import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import PublicNav from '../../components/layout/PublicNav'
import { ToastProvider } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { ErrorMessage } from '../../components/common/Feedback'
import { getProviderById } from '../../api/providerService'
import { useAuth } from '../../context/AuthContext'
import {
  Star, MapPin, Clock, IndianRupee, Stethoscope,
  GraduationCap, Building2, CalendarCheck, ArrowLeft, CheckCircle
} from 'lucide-react'

function ProviderDetailInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  const [provider, setProvider] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getProviderById(id)
      .then(res => setProvider(res.data))
      .catch(err => setError(err.response?.data?.error || 'Provider not found'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-slate-50"><PublicNav /><div className="flex justify-center py-20"><Spinner size="lg" /></div></div>
  if (error)   return <div className="min-h-screen bg-slate-50"><PublicNav /><div className="max-w-xl mx-auto px-4 py-12"><ErrorMessage message={error} /></div></div>

  const initials = provider.clinicName?.slice(0, 2).toUpperCase() || 'DR'
  const canBook  = isAuthenticated && role === 'PATIENT' && provider.isAvailable && provider.isVerified

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to results
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main card */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile header */}
            <div className="card">
              <div className="flex items-start gap-5">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-2xl flex-shrink-0 overflow-hidden">
                  {provider.profilePicUrl
                    ? <img src={provider.profilePicUrl} alt="" className="h-full w-full object-cover" />
                    : initials
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="font-serif text-2xl text-navy-900">{provider.clinicName || 'Medical Clinic'}</h1>
                      <p className="text-emerald-600 font-medium">{provider.specialization}</p>
                    </div>
                    {provider.isAvailable
                      ? <span className="badge-approved flex-shrink-0"><CheckCircle className="h-3.5 w-3.5" />Available</span>
                      : <span className="badge-pending flex-shrink-0">On Leave</span>
                    }
                  </div>
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-700">
                        {provider.avgRating > 0 ? provider.avgRating.toFixed(1) : 'New'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {provider.experienceYears} yrs experience
                    </div>
                    {provider.consultationFee > 0 && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <IndianRupee className="h-3.5 w-3.5" />
                        ₹{provider.consultationFee}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            {provider.bio && (
              <div className="card">
                <h2 className="font-serif text-lg text-navy-900 mb-3">About</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{provider.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="card">
              <h2 className="font-serif text-lg text-navy-900 mb-4">Details</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-4.5 w-4.5 text-navy-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Qualification</p>
                    <p className="text-sm text-slate-700">{provider.qualification}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Stethoscope className="h-4.5 w-4.5 text-navy-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Specialization</p>
                    <p className="text-sm text-slate-700">{provider.specialization}</p>
                  </div>
                </div>
                {provider.clinicAddress && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4.5 w-4.5 text-navy-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Clinic Address</p>
                      <p className="text-sm text-slate-700">{provider.clinicAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="space-y-4">
            <div className="card sticky top-20">
              <h2 className="font-serif text-lg text-navy-900 mb-4">Book Appointment</h2>
              {!isAuthenticated ? (
                <div className="text-center py-2">
                  <p className="text-sm text-slate-500 mb-4">Sign in to book an appointment with this doctor.</p>
                  <Link to="/login" className="btn-primary w-full block text-center">Sign In to Book</Link>
                  <Link to="/register" className="btn-secondary w-full block text-center mt-2 text-sm">Create Account</Link>
                </div>
              ) : role !== 'PATIENT' ? (
                <p className="text-sm text-slate-500">Only patients can book appointments.</p>
              ) : !provider.isAvailable ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                  This doctor is currently on leave.
                </div>
              ) : (
                <Link
                  to={`/patient/slots/${provider.providerId}`}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <CalendarCheck className="h-4.5 w-4.5" />
                  View Available Slots
                </Link>
              )}

              {provider.consultationFee > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm">
                  <span className="text-slate-500">Consultation fee</span>
                  <span className="font-semibold text-navy-700">₹{provider.consultationFee}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProviderDetail() {
  return <ToastProvider><ProviderDetailInner /></ToastProvider>
}
