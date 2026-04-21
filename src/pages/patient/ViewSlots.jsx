import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { ErrorMessage, EmptyState } from '../../components/common/Feedback'
import { getProviderById } from '../../api/providerService'
import { getAvailableSlots } from '../../api/scheduleService'
import { format, addDays, isBefore, startOfToday } from 'date-fns'
import { Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

function ViewSlotsInner() {
  const { providerId } = useParams()
  const navigate = useNavigate()

  const [provider, setProvider]   = useState(null)
  const [slots, setSlots]         = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [loadingProv, setLoadingProv]   = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError]               = useState(null)

  // Load provider info
  useEffect(() => {
    getProviderById(providerId)
      .then(res => setProvider(res.data))
      .catch(() => setError('Provider not found.'))
      .finally(() => setLoadingProv(false))
  }, [providerId])

  // Load slots whenever date changes
  useEffect(() => {
    if (!providerId) return
    setLoadingSlots(true)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    getAvailableSlots(providerId, dateStr)
      .then(res => setSlots(res.data))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [providerId, selectedDate])

  // Build a 7-day strip
  const today = startOfToday()
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i))

  const prevDay = () => {
    const prev = addDays(selectedDate, -1)
    if (!isBefore(prev, today)) setSelectedDate(prev)
  }
  const nextDay = () => setSelectedDate(addDays(selectedDate, 1))

  if (loadingProv) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>
  if (error)       return <DashboardLayout><div className="max-w-md"><ErrorMessage message={error} /></div></DashboardLayout>

  const initials = provider?.clinicName?.slice(0, 2).toUpperCase() || 'DR'

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy-700 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Provider header */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-lg overflow-hidden flex-shrink-0">
              {provider?.profilePicUrl
                ? <img src={provider.profilePicUrl} alt="" className="h-full w-full object-cover" />
                : initials}
            </div>
            <div>
              <h1 className="font-serif text-xl text-navy-900">{provider?.clinicName || 'Medical Clinic'}</h1>
              <p className="text-sm text-emerald-600 font-medium">{provider?.specialization}</p>
              {provider?.consultationFee > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">₹{provider.consultationFee} consultation fee</p>
              )}
            </div>
          </div>
        </div>

        {/* Date picker strip */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base text-navy-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-navy-500" />
              Select a Date
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-40"
                disabled={isBefore(addDays(selectedDate, -1), today)}>
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-700 mx-1 min-w-[110px] text-center">
                {format(selectedDate, 'MMM d, yyyy')}
              </span>
              <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <ChevronRight className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map(day => {
              const active = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl border-2 transition-all duration-150 min-w-[52px] ${
                    active
                      ? 'border-navy-600 bg-navy-700 text-white'
                      : 'border-slate-200 hover:border-navy-300 text-slate-700'
                  }`}
                >
                  <span className={`text-xs font-medium ${active ? 'text-navy-200' : 'text-slate-400'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-base font-semibold mt-0.5 ${active ? 'text-white' : 'text-slate-800'}`}>
                    {format(day, 'd')}
                  </span>
                  <span className={`text-xs ${active ? 'text-navy-200' : 'text-slate-400'}`}>
                    {format(day, 'MMM')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Slots */}
        <div className="card">
          <h2 className="font-serif text-base text-navy-900 mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-navy-500" />
            Available Times — {format(selectedDate, 'EEEE, MMMM d')}
          </h2>

          {loadingSlots ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : slots.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No slots available"
              description="This doctor has no open slots for this date. Try a different day."
            />
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {slots.map(slot => (
                <button
                  key={slot.slotId}
                  onClick={() => navigate(`/patient/book/${slot.slotId}`, {
                    state: { slot, provider }
                  })}
                  className="flex flex-col items-center py-3 px-2 rounded-xl border-2 border-slate-200 hover:border-navy-500 hover:bg-navy-50 transition-all duration-150 group"
                >
                  <span className="text-sm font-semibold text-slate-800 group-hover:text-navy-700">
                    {slot.startTime.slice(0, 5)}
                  </span>
                  <span className="text-xs text-slate-400 mt-0.5">{slot.durationMinutes} min</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ViewSlots() {
  return <ToastProvider><ViewSlotsInner /></ToastProvider>
}
