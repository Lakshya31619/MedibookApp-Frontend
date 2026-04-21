import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/common/Toast'
import { PrivateRoute, RoleRoute, GuestRoute } from './routes/Guards'

// Public pages
import LandingPage       from './pages/public/LandingPage'
import ProviderDirectory from './pages/public/ProviderDirectory'
import ProviderDetail    from './pages/public/ProviderDetail'
import UnauthorizedPage  from './pages/public/UnauthorizedPage'

// Auth pages
import LoginPage         from './pages/auth/LoginPage'
import RegisterPage      from './pages/auth/RegisterPage'
import OAuth2Callback    from './pages/auth/OAuth2Callback'

// Patient pages
import PatientDashboard  from './pages/patient/PatientDashboard'
import BrowseProviders   from './pages/patient/BrowseProviders'
import ViewSlots         from './pages/patient/ViewSlots'
import BookingPage       from './pages/patient/BookingPage'
import MyAppointments    from './pages/patient/MyAppointments'

// Provider pages
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProfileSetup      from './pages/provider/ProfileSetup'
import SlotManagement    from './pages/provider/SlotManagement'
import ProviderProfile   from './pages/provider/ProviderProfile'

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard'
import PendingApprovals  from './pages/admin/PendingApprovals'
import AllProviders      from './pages/admin/AllProviders'
import AdminProviderDetail from './pages/admin/AdminProviderDetail'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/"                  element={<LandingPage />} />
          <Route path="/providers"         element={<ProviderDirectory />} />
          <Route path="/providers/:id"     element={<ProviderDetail />} />
          <Route path="/unauthorized"      element={<UnauthorizedPage />} />

          {/* Auth */}
          <Route path="/login"             element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"          element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/oauth2/callback"   element={<OAuth2Callback />} />

          {/* Patient */}
          <Route path="/patient/dashboard"    element={<RoleRoute roles={['PATIENT']}><PatientDashboard /></RoleRoute>} />
          <Route path="/patient/browse"       element={<RoleRoute roles={['PATIENT']}><BrowseProviders /></RoleRoute>} />
          <Route path="/patient/slots/:providerId" element={<RoleRoute roles={['PATIENT']}><ViewSlots /></RoleRoute>} />
          <Route path="/patient/book/:slotId" element={<RoleRoute roles={['PATIENT']}><BookingPage /></RoleRoute>} />
          <Route path="/patient/appointments" element={<RoleRoute roles={['PATIENT']}><MyAppointments /></RoleRoute>} />

          {/* Provider */}
          <Route path="/provider/dashboard"  element={<RoleRoute roles={['PROVIDER']}><ProviderDashboard /></RoleRoute>} />
          <Route path="/provider/setup"      element={<RoleRoute roles={['PROVIDER']}><ProfileSetup /></RoleRoute>} />
          <Route path="/provider/slots"      element={<RoleRoute roles={['PROVIDER']}><SlotManagement /></RoleRoute>} />
          <Route path="/provider/profile"    element={<RoleRoute roles={['PROVIDER']}><ProviderProfile /></RoleRoute>} />

          {/* Admin */}
          <Route path="/admin/dashboard"     element={<RoleRoute roles={['ADMIN']}><AdminDashboard /></RoleRoute>} />
          <Route path="/admin/pending"       element={<RoleRoute roles={['ADMIN']}><PendingApprovals /></RoleRoute>} />
          <Route path="/admin/providers"     element={<RoleRoute roles={['ADMIN']}><AllProviders /></RoleRoute>} />
          <Route path="/admin/providers/:id" element={<RoleRoute roles={['ADMIN']}><AdminProviderDetail /></RoleRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
