import { providerApi } from './axiosInstances'

// GET /providers  — public, returns ProviderSummary[]
// ProviderSummary: { providerId, specialization, clinicName, clinicAddress, avgRating, isAvailable, consultationFee, profilePicUrl, experienceYears }
export const getVerifiedProviders = () => providerApi.get('/providers')

// GET /providers/{id}  — returns ProviderResponse (full)
// ProviderResponse: { providerId, userId, specialization, qualification, experienceYears, bio, clinicName, clinicAddress, avgRating, isAvailable, isVerified, verificationStatus, rejectionReason, consultationFee, profilePicUrl, createdAt }
export const getProviderById = (id) => providerApi.get(`/providers/${id}`)

// GET /providers/search?q=
export const searchProviders = (q) => providerApi.get('/providers/search', { params: { q } })

// GET /providers/specialization/{spec}
export const getBySpecialization = (spec) => providerApi.get(`/providers/specialization/${spec}`)

// GET /providers/location?city=
export const getByLocation = (city) => providerApi.get('/providers/location', { params: { city } })

// POST /providers/register  — PROVIDER or ADMIN role required
// Body: { userId, specialization, qualification, experienceYears, bio?, clinicName?, clinicAddress?, consultationFee?, profilePicUrl? }
// Response: { message, providerId, verificationStatus }
export const registerProvider = (data) => providerApi.post('/providers/register', data)

// GET /providers/my/{userId}  — PROVIDER or ADMIN role required
export const getMyProviderProfile = (userId) => providerApi.get(`/providers/my/${userId}`)

// PUT /providers/{id}  — PROVIDER or ADMIN role required
// Body: { specialization?, qualification?, experienceYears?, bio?, clinicName?, clinicAddress?, consultationFee?, profilePicUrl? }
export const updateProvider = (id, data) => providerApi.put(`/providers/${id}`, data)

// PUT /providers/{id}/availability?status=true|false
export const setAvailability = (id, status) =>
  providerApi.put(`/providers/${id}/availability`, null, { params: { status } })

// GET /providers/admin/all  — ADMIN only
export const adminGetAllProviders = () => providerApi.get('/providers/admin/all')

// GET /providers/admin/pending  — ADMIN only
export const adminGetPendingProviders = () => providerApi.get('/providers/admin/pending')

// PUT /providers/{id}/verify  — ADMIN only
// Response: { message, providerId, verificationStatus: "APPROVED" }
export const verifyProvider = (id) => providerApi.put(`/providers/${id}/verify`)

// POST /providers/{id}/reject  — ADMIN only
// Body: { reason }
// Response: { message, providerId, verificationStatus: "REJECTED", reason }
export const rejectProvider = (id, reason) => providerApi.post(`/providers/${id}/reject`, { reason })

// PUT /providers/{id}/unverify  — ADMIN only
export const unverifyProvider = (id) => providerApi.put(`/providers/${id}/unverify`)

// DELETE /providers/{id}  — ADMIN only
export const deleteProvider = (id) => providerApi.delete(`/providers/${id}`)

// GET /providers/analytics/specializations  — ADMIN only
// Response: SpecializationCount[] { specialization, count }
export const getSpecializationStats = () => providerApi.get('/providers/analytics/specializations')

// GET /providers/{id}/verified
export const checkProviderVerified = (id) => providerApi.get(`/providers/${id}/verified`)
