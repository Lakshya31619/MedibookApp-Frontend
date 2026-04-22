// ─── Payment Models (port 8085) ────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELLED';
export type PaymentMode = 'CARD' | 'UPI' | 'WALLET' | 'CASH';

export interface PaymentResponse {
  paymentId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  amount: number;
  status: PaymentStatus;
  mode: PaymentMode;
  transactionId: string;
  currency: string;
  paidAt: string | null;
  refundedAt: string | null;
  refundTransactionId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaymentSummary {
  paymentId: number;
  appointmentId: number;
  amount: number;
  status: PaymentStatus;
  mode: PaymentMode;
  paidAt: string | null;
  currency: string;
}

export interface ProcessPaymentRequest {
  appointmentId: number;
  patientId: number;
  providerId: number;
  amount: number;
  mode: PaymentMode;
  transactionId?: string;   // required for CARD / UPI / WALLET
  notes?: string;
}

export interface RefundRequest {
  reason?: string;
}

export interface EarningsSummary {
  providerId: number;
  totalEarned: number;
  pendingAmount: number;
  totalRefunded: number;
  netEarnings: number;
}

export interface Invoice {
  invoiceNumber: string;
  appointmentId: number;
  patientId: number;
  providerId: number;
  amount: number;
  currency: string;
  mode: string;
  transactionId: string;
  paidAt: string;
  generatedAt: string;
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  monthName: string;
  revenue: number;
}

export interface PlatformRevenue {
  totalRevenue: number;
  monthlyBreakdown: MonthlyRevenue[];
}