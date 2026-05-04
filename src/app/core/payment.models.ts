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
  transactionId?: string;   // required for CARD / UPI / WALLET (non-Razorpay / CASH flow)
  notes?: string;
}

// ─── Razorpay types ───────────────────────────────────────────────────────────

/** Sent to POST /payments/razorpay/create-order */
export interface RazorpayOrderRequest {
  appointmentId: number;
  patientId: number;
  providerId: number;
  amount: number;       // INR rupees
  notes?: string;
}

/** Received from POST /payments/razorpay/create-order */
export interface RazorpayOrderResponse {
  orderId: string;      // e.g. order_XXXXXXXXXX
  currency: string;
  amountPaise: number;
  keyId: string;        // publishable key — safe to use in the checkout
}

/** Sent to POST /payments/razorpay/verify after the checkout popup closes successfully */
export interface RazorpayVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  appointmentId: number;
  patientId: number;
  providerId: number;
  amount: number;
  mode: PaymentMode;
  notes?: string;
}

/**
 * Shape of the handler object passed to window.Razorpay({ handler }).
 * Razorpay injects this into the global scope via checkout.js.
 */
export interface RazorpayHandlerResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// ─── Existing DTOs (unchanged) ────────────────────────────────────────────────

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