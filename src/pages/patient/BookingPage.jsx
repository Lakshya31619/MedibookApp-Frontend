import React, { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { ErrorMessage } from '../../components/common/Feedback'
import { getSlotById } from '../../api/scheduleService'
import { getProviderById } from '../../api/providerService'
import { bookSlot } from '../../api/scheduleService'
import { useAuth } from '../../context/AuthContext'
import { format, parseISO } from 'date-fns'
import {
  ArrowLeft, Calendar, Clock, MapPin, IndianRupee,
  CheckCircle, User, Stethoscope, AlertCircle
} from 'lucide-react'

function BookingPageInner() {
  const { slotId }    = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()
  const toast         = useToast()
  const { user }      = useAuth()

  // State passed from ViewSlots, or fetch fresh
  const [slot, setSlot]         = useState(location.state?.slot || null)
  const [provider, setProvider] = useState(location.state?.provider || null)
  const [loading, setLoading]   = useState(!slot || !provider)
  const [booking, setBooking]   = useState(false)
  const [booked, setBooked]     = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (slot && provider) return
    const fetchAll = async () => {
      try {
        const [slotRes, provRes] = await Promise.all([
          getSlotById(slotId),
          slot ? null : getSlotById(slotId)
        ])
        setSlot(slotRes.data)
        const pRes = await getProviderById(slotRes.data.providerId)
        setProvider(pRes.data)
      } catch {
        setError('Could not load booking details.')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [slotId])

  const handleBook = async () => {
    setBooking(true)
    try {
      await bookSlot(slotId)
      setBooked(true)
      toast.success('Appointment booked successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed. Please try again.')
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>
  if (error)   return <DashboardLayout><div className="max-w-md"><ErrorMessage message={error} /></div></DashboardLayout>

  const dateStr = slot?.date ? format(parseISO(slot.date), 'EEEE, MMMM d, yyyy') : ''

  // Success state
  if (booked) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto text-center animate-slide-up pt-10">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="font-serif text-3xl text-navy-900 mb-2">Appointment Confirmed!</h1>
          <p className="text-slate-500 mb-6 text-sm">Your slot has been reserved. Please arrive 10 minutes early.</p>

          <div className="card text-left mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4.5 w-4.5 text-navy-500 flex-shrink-0" />
                <span className="text-slate-700">{dateStr}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4.5 w-4.5 text-navy-500 flex-shrink-0" />
                <span className="text-slate-700">{slot.startTime?.slice(0,5)} – {slot.endTime?.slice(0,5)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Stethoscope className="h-4.5 w-4.5 text-navy-500 flex-shrink-0" />
                <span className="text-slate-700">{provider?.clinicName} · {provider?.specialization}</span>
              </div>
              {provider?.clinicAddress && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4.5 w-4.5 text-navy-500 flex-shrink-0" />
                  <span className="text-slate-700">{provider.clinicAddress}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => navigate('/patient/appointments')} className="btn-primary w-full">
              View My Appointments
            </button>
            <button onClick={() => navigate('/patient/browse')} className="btn-secondary w-full">
              Book Another
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-lg">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to slots
        </button>

        <div className="page-header">
          <h1 className="page-title">Confirm Booking</h1>
          <p className="page-subtitle">Review your appointment details below</p>
        </div>

        {/* Slot already booked warning */}
        {slot?.isBooked && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">This slot was just taken. Please go back and pick another time.</p>
          </div>
        )}

        {/* Appointment summary */}
        <div className="card mb-4">
          <h2 className="font-serif text-base text-navy-900 mb-4">Appointment Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4.5 w-4.5 text-navy-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Date</p>
                <p className="text-sm font-medium text-slate-800">{dateStr}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-navy-50 flex items-center justify-center flex-shrink-0">
                <Clock className="h-4.5 w-4.5 text-navy-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Time</p>
                <p className="text-sm font-medium text-slate-800">
                  {slot?.startTime?.slice(0,5)} – {slot?.endTime?.slice(0,5)}
                  <span className="text-slate-400 font-normal ml-1">({slot?.durationMinutes} min)</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Provider summary */}
        <div className="card mb-4">
          <h2 className="font-serif text-base text-navy-900 mb-4">Doctor Details</h2>
          <div className="flex items-center gap-4 mb-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-base overflow-hidden flex-shrink-0">
              {provider?.profilePicUrl
                ? <img src={provider.profilePicUrl} alt="" className="h-full w-full object-cover" />
                : provider?.clinicName?.slice(0,2) || 'DR'}
            </div>
            <div>
              <p className="font-medium text-slate-800">{provider?.clinicName}</p>
              <p className="text-sm text-emerald-600">{provider?.specialization}</p>
            </div>
          </div>
          {provider?.clinicAddress && (
            <div className="flex items-start gap-2 text-sm text-slate-500">
              <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
              <span>{provider.clinicAddress}</span>
            </div>
          )}
        </div>

        {/* Patient summary */}
        <div className="card mb-6">
          <h2 className="font-serif text-base text-navy-900 mb-3">Patient Details</h2>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span>{user?.fullName} · {user?.email}</span>
          </div>
        </div>

        {/* Fee + confirm */}
        {provider?.consultationFee > 0 && (
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-sm text-slate-500">Consultation fee</span>
            <span className="font-semibold text-navy-700 flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />₹{provider.consultationFee}
            </span>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={booking || slot?.isBooked}
          className="btn-primary w-full py-3.5 text-base flex items-center justify-center gap-2"
        >
          {booking ? 'Confirming…' : (<><CheckCircle className="h-4.5 w-4.5" /> Confirm Appointment</>)}
        </button>
        <p className="text-xs text-slate-400 text-center mt-3">
          Cancellation policy: Contact the clinic at least 24 hours in advance.
        </p>
      </div>
    </DashboardLayout>
  )
}

export default function BookingPage() {
  return <ToastProvider><BookingPageInner /></ToastProvider>
}
