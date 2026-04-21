import React, { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import { ToastProvider, useToast } from '../../components/common/Toast'
import Spinner from '../../components/common/Spinner'
import { EmptyState } from '../../components/common/Feedback'
import ConfirmModal from '../../components/common/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { getMyProviderProfile } from '../../api/providerService'
import {
  getProviderSlots, addSlot, addBulkSlots,
  addRecurringSlots, blockSlot, unblockSlot, deleteSlot
} from '../../api/scheduleService'
import { format, parseISO } from 'date-fns'
import {
  Plus, Repeat, LayoutList, Calendar, Clock,
  Lock, Unlock, Trash2, CheckCircle, XCircle, AlertCircle
} from 'lucide-react'

const DAYS = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY']
const DAY_SHORT = { MONDAY:'Mon', TUESDAY:'Tue', WEDNESDAY:'Wed', THURSDAY:'Thu', FRIDAY:'Fri', SATURDAY:'Sat', SUNDAY:'Sun' }

function SlotBadge({ slot }) {
  if (slot.isBooked)   return <span className="badge-approved text-xs">Booked</span>
  if (slot.isBlocked)  return <span className="badge-rejected text-xs">Blocked</span>
  return <span className="badge-pending text-xs">Open</span>
}

function SlotManagementInner() {
  const { user } = useAuth()
  const toast    = useToast()

  const [profile, setProfile]       = useState(null)
  const [slots, setSlots]           = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingSlots, setLoadingSlots]     = useState(false)
  const [activeTab, setActiveTab]   = useState('single')  // single | bulk | recurring
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)

  // Single slot form
  const [single, setSingle] = useState({ date: '', startTime: '', endTime: '' })
  const [singleLoading, setSingleLoading] = useState(false)

  // Bulk form — list of slot entries
  const [bulkEntries, setBulkEntries] = useState([{ date: '', startTime: '', endTime: '' }])
  const [bulkLoading, setBulkLoading] = useState(false)

  // Recurring form
  const [recur, setRecur] = useState({
    startDate: '', endDate: '', startTime: '', endTime: '',
    slotDurationMinutes: 30, recurrenceType: 'WEEKLY', daysOfWeek: []
  })
  const [recurLoading, setRecurLoading] = useState(false)

  // Load profile
  useEffect(() => {
    if (!user?.userId) return
    getMyProviderProfile(user.userId)
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoadingProfile(false))
  }, [user])

  // Load slots
  const loadSlots = useCallback(async () => {
    if (!profile?.providerId) return
    setLoadingSlots(true)
    try {
      const res = await getProviderSlots(profile.providerId)
      setSlots(res.data.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)))
    } catch { setSlots([]) }
    finally  { setLoadingSlots(false) }
  }, [profile?.providerId])

  useEffect(() => { loadSlots() }, [loadSlots])

  const notApproved = profile && profile.verificationStatus !== 'APPROVED'

  // Single slot submit
  const handleSingle = async (e) => {
    e.preventDefault()
    if (!single.date || !single.startTime || !single.endTime) { toast.error('Fill all fields.'); return }
    setSingleLoading(true)
    try {
      await addSlot({ providerId: profile.providerId, ...single })
      toast.success('Slot added.')
      setSingle({ date: '', startTime: '', endTime: '' })
      loadSlots()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to add slot.') }
    finally { setSingleLoading(false) }
  }

  // Bulk submit
  const handleBulk = async (e) => {
    e.preventDefault()
    const valid = bulkEntries.filter(s => s.date && s.startTime && s.endTime)
    if (!valid.length) { toast.error('Add at least one complete slot.'); return }
    setBulkLoading(true)
    try {
      const res = await addBulkSlots({ providerId: profile.providerId, slots: valid })
      toast.success(res.data.message)
      setBulkEntries([{ date: '', startTime: '', endTime: '' }])
      loadSlots()
    } catch (err) { toast.error(err.response?.data?.error || 'Bulk add failed.') }
    finally { setBulkLoading(false) }
  }

  // Recurring submit
  const handleRecur = async (e) => {
    e.preventDefault()
    if (!recur.startDate || !recur.endDate || !recur.startTime || !recur.endTime || !recur.recurrenceType) {
      toast.error('Fill all required fields.'); return
    }
    setRecurLoading(true)
    try {
      const payload = {
        providerId: profile.providerId,
        ...recur,
        slotDurationMinutes: Number(recur.slotDurationMinutes),
        daysOfWeek: recur.recurrenceType === 'WEEKLY' ? recur.daysOfWeek : undefined,
      }
      const res = await addRecurringSlots(payload)
      toast.success(res.data.message)
      loadSlots()
    } catch (err) { toast.error(err.response?.data?.error || 'Recurring slots failed.') }
    finally { setRecurLoading(false) }
  }

  const handleBlock = async (slot) => {
    try {
      if (slot.isBlocked) { await unblockSlot(slot.slotId); toast.success('Slot unblocked.') }
      else                { await blockSlot(slot.slotId);   toast.success('Slot blocked.') }
      loadSlots()
    } catch (err) { toast.error(err.response?.data?.error || 'Action failed.') }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSlot(deleteTarget.slotId)
      toast.success('Slot deleted.')
      setDeleteTarget(null)
      loadSlots()
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed.') }
    finally { setDeleting(false) }
  }

  const toggleDay = (day) => {
    setRecur(r => ({
      ...r,
      daysOfWeek: r.daysOfWeek.includes(day)
        ? r.daysOfWeek.filter(d => d !== day)
        : [...r.daysOfWeek, day]
    }))
  }

  if (loadingProfile) return <DashboardLayout><div className="flex justify-center py-20"><Spinner size="lg" /></div></DashboardLayout>

  if (!profile) return (
    <DashboardLayout>
      <div className="max-w-md">
        <EmptyState icon={Calendar} title="No profile found" description="Set up your provider profile first." />
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Manage Slots</h1>
          <p className="page-subtitle">Add and manage your availability</p>
        </div>

        {notApproved && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700">
              <strong>Account not yet approved.</strong> You can view slots but cannot add or modify them until your profile is approved by an admin.
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Add slots panel */}
          {!notApproved && (
            <div className="lg:col-span-2 space-y-4">
              {/* Tab switcher */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                {[
                  { key: 'single',    label: 'Single',    icon: Plus },
                  { key: 'bulk',      label: 'Bulk',      icon: LayoutList },
                  { key: 'recurring', label: 'Recurring', icon: Repeat },
                ].map(t => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                      activeTab === t.key ? 'bg-white shadow-sm text-navy-800' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Single slot form */}
              {activeTab === 'single' && (
                <div className="card">
                  <h2 className="font-serif text-base text-navy-900 mb-4">Add Single Slot</h2>
                  <form onSubmit={handleSingle} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                      <input type="date" className="input-field" value={single.date}
                        onChange={e => setSingle(s => ({...s, date: e.target.value}))} min={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Start</label>
                        <input type="time" className="input-field" value={single.startTime}
                          onChange={e => setSingle(s => ({...s, startTime: e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">End</label>
                        <input type="time" className="input-field" value={single.endTime}
                          onChange={e => setSingle(s => ({...s, endTime: e.target.value}))} />
                      </div>
                    </div>
                    <button type="submit" disabled={singleLoading} className="btn-primary w-full text-sm py-2.5">
                      {singleLoading ? 'Adding…' : 'Add Slot'}
                    </button>
                  </form>
                </div>
              )}

              {/* Bulk form */}
              {activeTab === 'bulk' && (
                <div className="card">
                  <h2 className="font-serif text-base text-navy-900 mb-4">Add Multiple Slots</h2>
                  <form onSubmit={handleBulk} className="space-y-3">
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {bulkEntries.map((entry, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-500">Slot {i + 1}</span>
                            {bulkEntries.length > 1 && (
                              <button type="button" onClick={() => setBulkEntries(b => b.filter((_, j) => j !== i))}
                                className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                            )}
                          </div>
                          <input type="date" className="input-field text-sm" value={entry.date}
                            onChange={e => setBulkEntries(b => b.map((s, j) => j === i ? {...s, date: e.target.value} : s))}
                            min={format(new Date(), 'yyyy-MM-dd')} />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="time" className="input-field text-sm" value={entry.startTime}
                              onChange={e => setBulkEntries(b => b.map((s, j) => j === i ? {...s, startTime: e.target.value} : s))} />
                            <input type="time" className="input-field text-sm" value={entry.endTime}
                              onChange={e => setBulkEntries(b => b.map((s, j) => j === i ? {...s, endTime: e.target.value} : s))} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={() => setBulkEntries(b => [...b, { date: '', startTime: '', endTime: '' }])}
                      className="w-full text-sm text-navy-600 border border-dashed border-navy-300 rounded-xl py-2 hover:bg-navy-50 transition-colors">
                      + Add Another Slot
                    </button>
                    <button type="submit" disabled={bulkLoading} className="btn-primary w-full text-sm py-2.5">
                      {bulkLoading ? 'Saving…' : `Save ${bulkEntries.length} Slot${bulkEntries.length > 1 ? 's' : ''}`}
                    </button>
                  </form>
                </div>
              )}

              {/* Recurring form */}
              {activeTab === 'recurring' && (
                <div className="card">
                  <h2 className="font-serif text-base text-navy-900 mb-4">Generate Recurring Slots</h2>
                  <form onSubmit={handleRecur} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
                        <input type="date" className="input-field text-sm" value={recur.startDate}
                          onChange={e => setRecur(r => ({...r, startDate: e.target.value}))}
                          min={format(new Date(), 'yyyy-MM-dd')} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
                        <input type="date" className="input-field text-sm" value={recur.endDate}
                          onChange={e => setRecur(r => ({...r, endDate: e.target.value}))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Start Time</label>
                        <input type="time" className="input-field text-sm" value={recur.startTime}
                          onChange={e => setRecur(r => ({...r, startTime: e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">End Time</label>
                        <input type="time" className="input-field text-sm" value={recur.endTime}
                          onChange={e => setRecur(r => ({...r, endTime: e.target.value}))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Duration (min)</label>
                        <select className="input-field text-sm" value={recur.slotDurationMinutes}
                          onChange={e => setRecur(r => ({...r, slotDurationMinutes: e.target.value}))}>
                          {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m} min</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Pattern</label>
                        <select className="input-field text-sm" value={recur.recurrenceType}
                          onChange={e => setRecur(r => ({...r, recurrenceType: e.target.value}))}>
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="WEEKDAYS">Weekdays</option>
                        </select>
                      </div>
                    </div>
                    {recur.recurrenceType === 'WEEKLY' && (
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-2">Days of Week</label>
                        <div className="flex flex-wrap gap-1.5">
                          {DAYS.map(d => (
                            <button key={d} type="button" onClick={() => toggleDay(d)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                recur.daysOfWeek.includes(d) ? 'bg-navy-700 text-white' : 'border border-slate-200 text-slate-600 hover:border-navy-300'
                              }`}>
                              {DAY_SHORT[d]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button type="submit" disabled={recurLoading} className="btn-primary w-full text-sm py-2.5">
                      {recurLoading ? 'Generating…' : 'Generate Slots'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Slots list */}
          <div className={notApproved ? 'lg:col-span-5' : 'lg:col-span-3'}>
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-serif text-lg text-navy-900">My Slots</h2>
                <button onClick={loadSlots} className="text-xs text-slate-500 hover:text-navy-600 transition-colors">Refresh</button>
              </div>
              {loadingSlots ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : slots.length === 0 ? (
                <EmptyState icon={Clock} title="No slots yet" description="Add your first slot using the panel on the left." />
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {slots.map(slot => (
                    <div key={slot.slotId}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        slot.isBooked ? 'bg-emerald-50 border-emerald-100' :
                        slot.isBlocked ? 'bg-red-50 border-red-100' :
                        'bg-white border-slate-100'
                      }`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-700">
                            {slot.date ? format(parseISO(slot.date), 'MMM d, EEE') : ''}
                          </span>
                          <span className="text-xs text-slate-500">
                            {slot.startTime?.slice(0,5)} – {slot.endTime?.slice(0,5)}
                          </span>
                          <SlotBadge slot={slot} />
                        </div>
                        <span className="text-xs text-slate-400">{slot.durationMinutes} min · {slot.recurrence || 'NONE'}</span>
                      </div>
                      {!slot.isBooked && !notApproved && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleBlock(slot)}
                            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-700 transition-colors"
                            title={slot.isBlocked ? 'Unblock' : 'Block'}>
                            {slot.isBlocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                          </button>
                          <button onClick={() => setDeleteTarget(slot)}
                            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete slot?"
        message={deleteTarget ? `Delete slot on ${deleteTarget.date} at ${deleteTarget.startTime?.slice(0,5)}?` : ''}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Delete"
        loading={deleting}
      />
    </DashboardLayout>
  )
}

export default function SlotManagement() {
  return <ToastProvider><SlotManagementInner /></ToastProvider>
}
