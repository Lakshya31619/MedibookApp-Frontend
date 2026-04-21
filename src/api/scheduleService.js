import { scheduleApi } from './axiosInstances'

// GET /slots/available/{providerId}?date=YYYY-MM-DD  — public
// Response: SlotSummary[] { slotId, date, startTime, endTime, durationMinutes }
export const getAvailableSlots = (providerId, date) =>
  scheduleApi.get(`/slots/available/${providerId}`, { params: { date } })

// GET /slots/provider/{providerId}/available  — public, future slots
export const getFutureAvailableSlots = (providerId) =>
  scheduleApi.get(`/slots/provider/${providerId}/available`)

// GET /slots/provider/{providerId}  — PROVIDER or ADMIN
// Response: SlotResponse[] { slotId, providerId, date, startTime, endTime, durationMinutes, isBooked, isBlocked, recurrence, createdAt }
export const getProviderSlots = (providerId) =>
  scheduleApi.get(`/slots/provider/${providerId}`)

// GET /slots/provider/{providerId}/range?startDate=&endDate=  — PROVIDER or ADMIN
export const getSlotsByRange = (providerId, startDate, endDate) =>
  scheduleApi.get(`/slots/provider/${providerId}/range`, { params: { startDate, endDate } })

// GET /slots/{slotId}
export const getSlotById = (slotId) => scheduleApi.get(`/slots/${slotId}`)

// GET /slots/provider/{providerId}/count
export const countAvailableSlots = (providerId) =>
  scheduleApi.get(`/slots/provider/${providerId}/count`)

// POST /slots/add  — PROVIDER or ADMIN
// Body: { providerId, date, startTime, endTime }
// Response: SlotResponse
export const addSlot = (data) => scheduleApi.post('/slots/add', data)

// POST /slots/bulk  — PROVIDER or ADMIN
// Body: { providerId, slots: [{ date, startTime, endTime }] }
// Response: BulkResult { slotsCreated, slotsSkipped, message }
export const addBulkSlots = (data) => scheduleApi.post('/slots/bulk', data)

// POST /slots/recurring  — PROVIDER or ADMIN
// Body: { providerId, startDate, endDate, startTime, endTime, slotDurationMinutes, recurrenceType, daysOfWeek? }
// Response: BulkResult { slotsCreated, slotsSkipped, message }
export const addRecurringSlots = (data) => scheduleApi.post('/slots/recurring', data)

// PUT /slots/{slotId}/book
export const bookSlot = (slotId) => scheduleApi.put(`/slots/${slotId}/book`)

// PUT /slots/{slotId}/release
export const releaseSlot = (slotId) => scheduleApi.put(`/slots/${slotId}/release`)

// PUT /slots/{slotId}/block  — PROVIDER or ADMIN
export const blockSlot = (slotId) => scheduleApi.put(`/slots/${slotId}/block`)

// PUT /slots/{slotId}/unblock  — PROVIDER or ADMIN
export const unblockSlot = (slotId) => scheduleApi.put(`/slots/${slotId}/unblock`)

// DELETE /slots/{slotId}  — PROVIDER or ADMIN
export const deleteSlot = (slotId) => scheduleApi.delete(`/slots/${slotId}`)

// POST /slots/admin/purge  — ADMIN
export const purgeExpiredSlots = () => scheduleApi.post('/slots/admin/purge')
