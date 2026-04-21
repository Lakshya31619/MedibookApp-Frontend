import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/Feedback'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { getVerifiedProviders } from '../../api/providerService'
import { getFutureAvailableSlots, releaseSlot } from '../../api/scheduleService'
import { format, parseISO, isBefore, startOfToday } from 'date-fns'
import { Calendar, Clock, MapPin, X, Stethoscope, CalendarX } from 'lucide-react'

// NOTE: The backend doesn't have a "get booked slots by patient" endpoint in the
// current services. We track bookings in localStorage as a client-side workaround,
// and display them here. In production you'd add a booking service.

const BOOKINGS_KEY = 'medibook_bookings'

function getBookings(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}')
    return all[userId] || []
  } catch { return [] }
}

function saveBooking(userId, booking) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}')
    all[userId] = [...(all[userId] || []), booking]
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all))
  } catch {}
}

function removeBooking(userId, slotId) {
  try {
    const all = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '{}')
    all[userId] = (all[userId] || []).filter(b => b.slotId !== slotId)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(all))
  } catch {}
}

export { saveBooking }

function MyAppointmentsInner() {
  const { user }  = useAuth()
  const toast     = useToast()
  const navigate  = useNavigate()
  const today     = startOfToday()

  const [bookings, setBookings]       = useState([])
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling]   = useState(false)
  const [tab, setTab]                 = useState('upcoming') // upcoming | past

  useEffect(() => {
    if (user?.userId) {
      setBookings(getBookings(user.userId))
    }
  }, [user])

  const upcoming = bookings.filter(b => !isBefore(parseISO(b.date), today))
  const past     = bookings.filter(b => isBefore(parseISO(b.date), today))
  const displayed = tab === 'upcoming' ? upcoming : past

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await releaseSlot(cancelTarget.slotId)
      removeBooking(user.userId, cancelTarget.slotId)
      setBookings(getBookings(user.userId))
      toast.success('Appointment cancelled.')
      setCancelTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancellation failed.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">My Appointments</h1>
          <p className="page-subtitle">{upcoming.length} upcoming</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          {[['upcoming', 'Upcoming', upcoming.length], ['past', 'Past', past.length]].map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
                tab === val ? 'bg-white shadow-sm text-navy-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === val ? 'bg-navy-100 text-navy-600' : 'bg-slate-200 text-slate-500'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title={tab === 'upcoming' ? 'No upcoming appointments' : 'No past appointments'}
            description={tab === 'upcoming' ? 'Book a slot with a doctor to get started.' : 'Your completed appointments will appear here.'}
            action={tab === 'upcoming' && (
              <button onClick={() => navigate('/patient/browse')} className="btn-primary text-sm">
                Find a Doctor
              </button>
            )}
          />
        ) : (
          <div className="space-y-3">
            {displayed.map(b => (
              <div key={b.slotId} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-navy-700 to-navy-500 flex items-center justify-center text-white font-serif text-sm overflow-hidden flex-shrink-0">
                      {b.providerPic
                        ? <img src={b.providerPic} alt="" className="h-full w-full object-cover" />
                        : b.providerName?.slice(0,2) || 'DR'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{b.providerName || 'Doctor'}</p>
                      <p className="text-xs text-emerald-600 font-medium mb-2">{b.specialization}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(parseISO(b.date), 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {b.startTime?.slice(0,5)} – {b.endTime?.slice(0,5)}
                        </div>
                        {b.clinicAddress && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <MapPin className="h-3.5 w-3.5" />
                            {b.clinicAddress}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {tab === 'upcoming' && (
                    <button
                      onClick={() => setCancelTarget(b)}
                      className="flex-shrink-0 p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                      title="Cancel appointment"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Book more CTA */}
        {tab === 'upcoming' && displayed.length > 0 && (
          <div className="mt-5">
            <button onClick={() => navigate('/patient/browse')} className="btn-secondary text-sm">
              + Book Another Appointment
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!cancelTarget}
        title="Cancel appointment?"
        message={cancelTarget ? `This will free up your slot on ${cancelTarget.date} at ${cancelTarget.startTime?.slice(0,5)}.` : ''}
        onConfirm={handleCancel}
        onCancel={() => setCancelTarget(null)}
        confirmLabel="Yes, Cancel"
        loading={cancelling}
      />
    </DashboardLayout>
  )
}

export default function MyAppointments() {
  return <ToastProvider><MyAppointmentsInner /></ToastProvider>
}
