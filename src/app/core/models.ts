// ─── Auth Models ───────────────────────────────────────────────────────────────
export type UserRole = 'PATIENT' | 'PROVIDER' | 'ADMIN';

export interface User {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;        // FIX: backend renamed isActive → active
  provider?: string;
  profilePicUrl?: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'PATIENT' | 'PROVIDER';
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Provider Models ────────────────────────────────────────────────────────────
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ProviderSummary {
  providerId: string;
  providerName?: string;  // FIX: doctor's full name from backend
  specialization: string;
  clinicName?: string;
  clinicAddress?: string;
  avgRating?: number;
  available: boolean;     // FIX: backend renamed isAvailable → available
  consultationFee?: number;
  profilePicUrl?: string;
  experienceYears?: number;
}

export interface ProviderResponse {
  providerId: string;
  userId: string;
  providerName?: string;  // FIX: doctor's full name from backend
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio?: string;
  clinicName?: string;
  clinicAddress?: string;
  avgRating?: number;
  available: boolean;     // FIX: backend renamed isAvailable → available
  verified: boolean;      // FIX: backend renamed isVerified → verified
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  consultationFee?: number;
  profilePicUrl?: string;
  createdAt: string;
}

export interface ProviderRegisterRequest {
  userId: string;
  providerName?: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio?: string;
  clinicName?: string;
  clinicAddress?: string;
  consultationFee?: number;
  profilePicUrl?: string;
}

export interface SpecializationCount {
  specialization: string;
  count: number;
}

// ─── Slot Models ────────────────────────────────────────────────────────────────
export type RecurrenceType = 'DAILY' | 'WEEKLY' | 'WEEKDAYS';

export interface SlotSummary {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface SlotResponse {
  slotId: string;
  providerId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  booked: boolean;        // FIX: backend renamed isBooked → booked
  blocked: boolean;       // FIX: backend renamed isBlocked → blocked
  recurrence?: string;
  createdAt: string;
}

export interface RecurringSlotRequest {
  providerId: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  recurrenceType: RecurrenceType;
  daysOfWeek?: string[];
}

// ─── Appointment Models ─────────────────────────────────────────────────────────
export type AppointmentStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type ModeOfConsultation = 'IN_PERSON' | 'VIDEO';

export interface AppointmentResponse {
  appointmentId: string;
  patientId: string;
  providerId: string;
  slotId: string;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  modeOfConsultation: ModeOfConsultation;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentSummary {
  appointmentId: string;
  patientId: string;
  providerId: string;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  modeOfConsultation: ModeOfConsultation;
  notes?: string;
}

export interface AppointmentCount {
  providerId: string;
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
}

export interface BookAppointmentRequest {
  patientId: number | string;
  providerId: number | string;
  slotId: number | string;
  serviceType: string;
  modeOfConsultation: ModeOfConsultation;
  notes?: string;
}

// ─── Toast ──────────────────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}