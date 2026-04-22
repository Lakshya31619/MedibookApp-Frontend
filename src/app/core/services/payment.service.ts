import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PaymentResponse, PaymentSummary, ProcessPaymentRequest,
  EarningsSummary, Invoice, PlatformRevenue
} from '../payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = environment.paymentServiceUrl;

  constructor(private http: HttpClient) {}

  // ── Patient endpoints ──────────────────────────────────────────────────────

  /** Process a payment after booking. Call immediately after POST /appointments/book */
  processPayment(body: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/payments/process`, body);
  }

  /** Get payment details for a specific appointment */
  getByAppointment(appointmentId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.base}/payments/appointment/${appointmentId}`);
  }

  /** Get all payments made by a patient */
  getByPatient(patientId: number): Observable<PaymentSummary[]> {
    return this.http.get<PaymentSummary[]>(`${this.base}/payments/patient/${patientId}`);
  }

  /** Get total amount spent by a patient */
  getPatientTotal(patientId: number): Observable<{ patientId: number; totalSpending: number; currency: string }> {
    return this.http.get<{ patientId: number; totalSpending: number; currency: string }>(
      `${this.base}/payments/patient/${patientId}/total`
    );
  }

  /** Get payment status for an appointment */
  getStatus(appointmentId: number): Observable<{ appointmentId: number; status: string }> {
    return this.http.get<{ appointmentId: number; status: string }>(
      `${this.base}/payments/status/${appointmentId}`
    );
  }

  /** Download invoice for a paid appointment */
  getInvoice(appointmentId: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/payments/invoice/${appointmentId}`);
  }

  /** Request a refund (called when appointment is cancelled) */
  refund(appointmentId: number, reason?: string): Observable<{ message: string; status: string; refundTransactionId: string; notes: string }> {
    return this.http.post<{ message: string; status: string; refundTransactionId: string; notes: string }>(
      `${this.base}/payments/refund/${appointmentId}`,
      { reason }
    );
  }

  // ── Provider endpoints ─────────────────────────────────────────────────────

  /** Get all payments for a provider's appointments */
  getByProvider(providerId: number): Observable<PaymentSummary[]> {
    return this.http.get<PaymentSummary[]>(`${this.base}/payments/provider/${providerId}`);
  }

  /** Get earnings summary for a provider */
  getEarnings(providerId: number): Observable<EarningsSummary> {
    return this.http.get<EarningsSummary>(`${this.base}/payments/earnings/${providerId}`);
  }

  /** Confirm that cash was collected for an appointment (PROVIDER/ADMIN) */
  confirmCash(appointmentId: number): Observable<{ message: string; appointmentId: number; status: string; paidAt: string }> {
    return this.http.post<{ message: string; appointmentId: number; status: string; paidAt: string }>(
      `${this.base}/payments/confirm-cash/${appointmentId}`, null
    );
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  /** Get all payments on the platform */
  getAll(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/payments/all`);
  }

  /** Manually update a payment's status */
  updateStatus(paymentId: number, value: string): Observable<{ message: string; paymentId: number }> {
    return this.http.put<{ message: string; paymentId: number }>(
      `${this.base}/payments/admin/${paymentId}/status`, null, { params: { value } }
    );
  }

  /** Get platform revenue with monthly breakdown */
  getPlatformRevenue(): Observable<PlatformRevenue> {
    return this.http.get<PlatformRevenue>(`${this.base}/payments/revenue`);
  }

  /** Get total platform revenue (quick stat) */
  getTotalRevenue(): Observable<{ totalRevenue: number; currency: string }> {
    return this.http.get<{ totalRevenue: number; currency: string }>(`${this.base}/payments/revenue/total`);
  }

  /** Get payments within a date range */
  getByRange(start: string, end: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/payments/admin/range`, {
      params: { start, end }
    });
  }
}