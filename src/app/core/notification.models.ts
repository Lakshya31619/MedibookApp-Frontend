// ─── Notification Models (port 8087) ─────────────────────────────────────────

export type NotificationChannel = 'APP' | 'EMAIL' | 'SMS';

export type NotificationType =
  // Appointment — to patient
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_COMPLETED'
  | 'APPOINTMENT_NO_SHOW'
  // Appointment — to provider
  | 'NEW_BOOKING_FOR_PROVIDER'
  | 'BOOKING_CANCELLED_FOR_PROVIDER'
  // Provider
  | 'PROVIDER_APPROVED'
  | 'PROVIDER_REJECTED'
  // Payment — to patient
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_REFUNDED'
  // Payment — to admin
  | 'ADMIN_PAYMENT_RECEIVED'
  | 'ADMIN_PAYMENT_REFUNDED'
  // Reviews & general
  | 'REVIEW_RECEIVED'
  | 'GENERAL';

export interface NotificationResponse {
  notificationId: number;
  recipientId:    number;
  type:           NotificationType | string;
  title:          string;
  message:        string;
  channel:        NotificationChannel | string;
  relatedId:      number;
  relatedType:    string;
  isRead:         boolean;
  sentAt:         string;
}

export interface SendNotificationRequest {
  recipientId:     number;
  type:            NotificationType | string;
  title?:          string;
  message?:        string;
  channels?:       NotificationChannel[];
  relatedId?:      number;
  relatedType?:    string;
  recipientEmail?: string;
  // optional context fields (used by the backend to build default title/message)
  appointmentDate?: string;
  appointmentTime?: string;
  providerName?:    string;
  patientName?:     string;
  amount?:          number;
  cancellationReason?: string;
}

export interface AppointmentEventRequest {
  eventType:        NotificationType | string;
  appointmentId:    number;
  patientId:        number;
  providerId:       number;
  appointmentDate?: string;
  appointmentTime?: string;
  providerName?:    string;
  patientName?:     string;
  cancellationReason?: string;
}

export interface PaymentEventRequest {
  eventType:        NotificationType | string;
  paymentId:        number;
  patientId:        number;
  adminId:          number;
  amount?:          number;
  appointmentDate?: string;
  providerName?:    string;
  patientEmail?:    string;
}

export interface ProviderEventRequest {
  eventType:        NotificationType | string;
  providerId:       number;
  providerName?:    string;
  rejectionReason?: string;
  providerEmail?:   string;
}

export interface BulkNotificationRequest {
  recipientIds:     number[];
  type:             NotificationType | string;
  title:            string;
  message:          string;
  channels?:        NotificationChannel[];
  recipientEmails?: string[];
}

export interface BulkSendResult {
  totalSent: number;
  failed:    number;
  message:   string;
}

export interface UnreadCount {
  recipientId:  number;
  unreadCount:  number;
}