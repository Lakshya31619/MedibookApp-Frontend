import { authApi } from './axiosInstances'

// POST /auth/register
// Body: { fullName, email, password, phone?, role }
// Response: { message, userId, email, role }
export const register = (data) => authApi.post('/auth/register', data)

// POST /auth/login
// Body: { email, password }
// Response: { token, tokenType, expiresIn, user: { userId, fullName, email, phone, role, ... } }
export const login = (data) => authApi.post('/auth/login', data)

// POST /auth/logout  (Authorization header required)
export const logout = () => authApi.post('/auth/logout')

// POST /auth/refresh  (Authorization header required)
export const refreshToken = () => authApi.post('/auth/refresh')

// GET /auth/profile/{userId}
// Response: { userId, fullName, email, phone, role, isActive, provider, profilePicUrl, createdAt }
export const getProfile = (userId) => authApi.get(`/auth/profile/${userId}`)

// PUT /auth/profile/{userId}
// Body: { fullName?, phone?, profilePicUrl? }
// Response: { message, user: {...} }
export const updateProfile = (userId, data) => authApi.put(`/auth/profile/${userId}`, data)

// PUT /auth/password
// Body: { currentPassword, newPassword }
export const changePassword = (data) => authApi.put('/auth/password', data)

// DELETE /auth/deactivate/{userId}
export const deactivateAccount = (userId) => authApi.delete(`/auth/deactivate/${userId}`)

// GET /auth/admin/users?role=
export const getAdminUsers = (role) => authApi.get('/auth/admin/users', { params: { role } })
