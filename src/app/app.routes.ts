import { Routes } from '@angular/router';
import { authGuard, roleGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public
  { path: '', loadComponent: () => import('./features/auth/landing.component').then(m => m.LandingComponent) },
  { path: 'providers', loadComponent: () => import('./features/auth/provider-directory.component').then(m => m.ProviderDirectoryComponent) },
  { path: 'providers/:id', loadComponent: () => import('./features/auth/provider-detail.component').then(m => m.ProviderDetailComponent) },

  // Auth
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'oauth2/callback', loadComponent: () => import('./features/auth/oauth2-callback.component').then(m => m.OAuth2CallbackComponent) },

  // Patient
  {
    path: 'patient',
    canActivate: [roleGuard('PATIENT')],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/patient/patient-dashboard.component').then(m => m.PatientDashboardComponent) },
      { path: 'browse', loadComponent: () => import('./features/auth/provider-directory.component').then(m => m.ProviderDirectoryComponent) },
      { path: 'appointments', loadComponent: () => import('./features/patient/patient-appointments.component').then(m => m.PatientAppointmentsComponent) },
      { path: 'book', loadComponent: () => import('./features/patient/patient-book.component').then(m => m.PatientBookComponent) },
      { path: 'profile', loadComponent: () => import('./features/patient/patient-profile.component').then(m => m.PatientProfileComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  // Provider
  {
    path: 'provider',
    canActivate: [roleGuard('PROVIDER')],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/provider/provider-dashboard.component').then(m => m.ProviderDashboardComponent) },
      { path: 'appointments', loadComponent: () => import('./features/provider/provider-appointments.component').then(m => m.ProviderAppointmentsComponent) },
      { path: 'slots', loadComponent: () => import('./features/provider/provider-slots.component').then(m => m.ProviderSlotsComponent) },
      { path: 'profile', loadComponent: () => import('./features/provider/provider-profile.component').then(m => m.ProviderProfileComponent) },
      { path: 'profile-setup', loadComponent: () => import('./features/provider/provider-profile-setup.component').then(m => m.ProviderProfileSetupComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  // Admin
  {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'pending', loadComponent: () => import('./features/admin/admin-pending.component').then(m => m.AdminPendingComponent) },
      { path: 'providers', loadComponent: () => import('./features/admin/admin-providers.component').then(m => m.AdminProvidersComponent) },
      { path: 'providers/:id', loadComponent: () => import('./features/admin/admin-provider-detail.component').then(m => m.AdminProviderDetailComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' },
];
