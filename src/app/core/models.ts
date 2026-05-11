// ─── Auth Models ───────────────────────────────────────────────────────────────
export type UserRole = 'PATIENT' | 'PROVIDER' | 'ADMIN';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  active: boolean;
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
  providerId: number;
  providerName?: string;
  specialization: string;
  clinicName?: string;
  clinicAddress?: string;
  avgRating?: number;
  available: boolean;
  consultationFee?: number;
  profilePicUrl?: string;
  experienceYears?: number;
}

export interface ProviderResponse {
  providerId: number;
  userId: number;
  providerName?: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  bio?: string;
  clinicName?: string;
  clinicAddress?: string;
  avgRating?: number;
  available: boolean;
  verified: boolean;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  consultationFee?: number;
  profilePicUrl?: string;
  createdAt: string;
}

export interface ProviderRegisterRequest {
  userId: number;
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
  slotId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface SlotResponse {
  slotId: number;
  providerId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  booked: boolean;
  blocked: boolean;
  recurrence?: string;
  createdAt: string;
}

export interface RecurringSlotRequest {
  providerId: number;
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
  appointmentId: number;
  patientId: number;
  providerId: number;
  slotId: number;
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
  appointmentId: number;
  patientId: number;
  providerId: number;
  serviceType: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  modeOfConsultation: ModeOfConsultation;
  notes?: string;
}

export interface AppointmentCount {
  providerId: number;
  total: number;
  completed: number;
  scheduled: number;
  cancelled: number;
  noShow: number;
}

export interface BookAppointmentRequest {
  patientId: number;
  providerId: number;
  slotId: number;
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