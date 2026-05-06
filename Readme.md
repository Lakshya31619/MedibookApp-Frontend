# MediBook — Angular Frontend

Full healthcare appointment booking platform built with **Angular 17+ (standalone)**, **TypeScript**, **Tailwind CSS**, and **Angular Router**.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:3000)
ng serve

# Build for production
ng build
```

---

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/
│   │   │   └── auth.guard.ts          # authGuard, roleGuard, guestGuard
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts    # JWT Bearer token injection
│   │   ├── services/
│   │   │   ├── auth.service.ts        # JWT session, OAuth2, profile
│   │   │   ├── provider.service.ts    # Provider CRUD + admin actions
│   │   │   ├── schedule.service.ts    # Slot management
│   │   │   ├── appointment.service.ts # Booking, cancel, reschedule
│   │   │   └── toast.service.ts       # Global notification signals
│   │   └── models.ts                  # All TypeScript interfaces
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── navbar.component.ts        # Public top navbar
│   │   │   ├── sidebar-layout.component.ts # Dashboard sidebar shell
│   │   │   ├── toast.component.ts         # Toast notification overlay
│   │   │   └── confirm-modal.component.ts # Reusable confirm/reason modal
│   │   └── pipes/
│   │       └── status.pipe.ts             # statusBadge, formatTime, formatDate
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── landing.component.ts
│   │   │   ├── login.component.ts
│   │   │   ├── register.component.ts
│   │   │   ├── oauth2-callback.component.ts
│   │   │   ├── provider-directory.component.ts
│   │   │   └── provider-detail.component.ts
│   │   │
│   │   ├── patient/
│   │   │   ├── patient-dashboard.component.ts
│   │   │   ├── patient-appointments.component.ts
│   │   │   ├── patient-book.component.ts
│   │   │   └── patient-profile.component.ts
│   │   │
│   │   ├── provider/
│   │   │   ├── provider-dashboard.component.ts
│   │   │   ├── provider-profile-setup.component.ts
│   │   │   ├── provider-profile.component.ts
│   │   │   ├── provider-slots.component.ts
│   │   │   └── provider-appointments.component.ts
│   │   │
│   │   └── admin/
│   │       ├── admin-dashboard.component.ts
│   │       ├── admin-pending.component.ts
│   │       ├── admin-providers.component.ts
│   │       └── admin-provider-detail.component.ts
│   │
│   ├── app.component.ts       # Root: RouterOutlet + Toast
│   ├── app.config.ts          # provideRouter + provideHttpClient + interceptors
│   └── app.routes.ts          # All lazy-loaded routes with guards
│
├── environments/
│   ├── environment.ts         # Dev: localhost:808x ports
│   └── environment.prod.ts    # Prod URLs
│
├── styles.css                 # Tailwind + Google Fonts + global classes
└── index.html
```

---

## Routes

| Path | Guard | Component |
|------|-------|-----------|
| `/` | — | Landing |
| `/providers` | — | Provider Directory |
| `/providers/:id` | — | Provider Detail + Slot Picker |
| `/login` | guestGuard | Login (email + Google OAuth2) |
| `/register` | guestGuard | Register (PATIENT or PROVIDER) |
| `/oauth2/callback` | — | OAuth2 token handler |
| `/patient/dashboard` | roleGuard(PATIENT) | Patient Dashboard |
| `/patient/browse` | roleGuard(PATIENT) | Browse Providers |
| `/patient/appointments` | roleGuard(PATIENT) | My Appointments |
| `/patient/book` | roleGuard(PATIENT) | Book Confirmation |
| `/patient/profile` | roleGuard(PATIENT) | Profile Edit |
| `/provider/dashboard` | roleGuard(PROVIDER) | Provider Dashboard |
| `/provider/appointments` | roleGuard(PROVIDER) | Provider Appointments |
| `/provider/slots` | roleGuard(PROVIDER) | Slot Management |
| `/provider/profile` | roleGuard(PROVIDER) | Provider Profile Edit |
| `/provider/profile-setup` | roleGuard(PROVIDER) | First-time Profile Setup |
| `/admin/dashboard` | roleGuard(ADMIN) | Admin Dashboard |
| `/admin/pending` | roleGuard(ADMIN) | Pending Approvals |
| `/admin/providers` | roleGuard(ADMIN) | All Providers Table |
| `/admin/providers/:id` | roleGuard(ADMIN) | Provider Detail + Actions |

---

## Environment Config

Edit `src/environments/environment.ts` to point at your backend services:

```typescript
export const environment = {
  authServiceUrl:        'http://localhost:8081',
  providerServiceUrl:    'http://localhost:8082',
  scheduleServiceUrl:    'http://localhost:8083',
  appointmentServiceUrl: 'http://localhost:8084',
  oauth2CallbackUrl:     'http://localhost:3000/oauth2/callback',
};
```

---

## Auth Flow

1. **Email login** → `POST /auth/login` → JWT stored in `localStorage` as `medibook_token`
2. **Google OAuth2** → Backend redirects to `/oauth2/callback?token=...` → Frontend decodes JWT, extracts role, stores session
3. **HTTP Interceptor** → Automatically attaches `Authorization: Bearer <token>` on all requests
4. **Route Guards** → `roleGuard('PATIENT'|'PROVIDER'|'ADMIN')` blocks cross-role access and redirects to correct dashboard

---

## Design System

- **Primary**: Navy blue `#162d5c` (Tailwind: `navy-700`)
- **Accent**: Emerald green `#059669` (Tailwind: `emerald-600`)
- **Headings font**: DM Serif Display
- **Body font**: DM Sans
- **Status badges**: `.badge-pending` (amber) · `.badge-approved` (emerald) · `.badge-rejected` (red) · `.badge-scheduled` (blue) · `.badge-completed` (emerald) · `.badge-cancelled` (gray) · `.badge-no-show` (red)
- **Button classes**: `.btn-primary` · `.btn-secondary` · `.btn-danger` · `.btn-emerald`
- **Card**: `.card` — white, rounded-2xl, subtle shadow
- **Input**: `.input-field` — consistent form inputs with focus ring

---

## Key Business Rules Implemented

- ✅ JWT interceptor on all HTTP requests
- ✅ Role-based routing guards (PATIENT/PROVIDER/ADMIN)
- ✅ Provider verification status banner (PENDING / APPROVED / REJECTED)
- ✅ Slot management locked behind APPROVED status
- ✅ 14-day date picker strip on provider detail + patient reschedule
- ✅ Cancel only available on SCHEDULED appointments
- ✅ Admin approve/reject with reason modal
- ✅ Toast notification system (success / error / info / warning)
- ✅ Confirmation modals for all destructive actions
- ✅ Booking flow: browse → select date → pick slot → confirm → call API
- ✅ Google OAuth2 callback with JWT decoding