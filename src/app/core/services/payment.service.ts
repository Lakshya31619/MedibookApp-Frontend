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
  private base = `${environment.apiUrl}/api/payments`;

  constructor(private http: HttpClient) {}

  // ── Patient endpoints ──────────────────────────────────────────────────────

  processPayment(body: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/process`, body);
  }

  getByAppointment(appointmentId: number): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.base}/appointment/${appointmentId}`);
  }

  getByPatient(patientId: number): Observable<PaymentSummary[]> {
    return this.http.get<PaymentSummary[]>(`${this.base}/patient/${patientId}`);
  }

  getPatientTotal(patientId: number): Observable<{ patientId: number; totalSpending: number; currency: string }> {
    return this.http.get<{ patientId: number; totalSpending: number; currency: string }>(
      `${this.base}/patient/${patientId}/total`
    );
  }

  getStatus(appointmentId: number): Observable<{ appointmentId: number; status: string }> {
    return this.http.get<{ appointmentId: number; status: string }>(
      `${this.base}/status/${appointmentId}`
    );
  }

  getInvoice(appointmentId: number): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.base}/invoice/${appointmentId}`);
  }

  refund(appointmentId: number, reason?: string): Observable<{ message: string; status: string; refundTransactionId: string; notes: string }> {
    return this.http.post<{ message: string; status: string; refundTransactionId: string; notes: string }>(
      `${this.base}/refund/${appointmentId}`,
      { reason }
    );
  }

  // ── Provider endpoints ─────────────────────────────────────────────────────

  getByProvider(providerId: number): Observable<PaymentSummary[]> {
    return this.http.get<PaymentSummary[]>(`${this.base}/provider/${providerId}`);
  }

  getEarnings(providerId: number): Observable<EarningsSummary> {
    return this.http.get<EarningsSummary>(`${this.base}/earnings/${providerId}`);
  }

  confirmCash(appointmentId: number): Observable<{ message: string; appointmentId: number; status: string; paidAt: string }> {
    return this.http.post<{ message: string; appointmentId: number; status: string; paidAt: string }>(
      `${this.base}/confirm-cash/${appointmentId}`, null
    );
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  getAll(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/all`);
  }

  updateStatus(paymentId: number, value: string): Observable<{ message: string; paymentId: number }> {
    return this.http.put<{ message: string; paymentId: number }>(
      `${this.base}/admin/${paymentId}/status`, null, { params: { value } }
    );
  }

  getPlatformRevenue(): Observable<PlatformRevenue> {
    return this.http.get<PlatformRevenue>(`${this.base}/revenue`);
  }

  getTotalRevenue(): Observable<{ totalRevenue: number; currency: string }> {
    return this.http.get<{ totalRevenue: number; currency: string }>(`${this.base}/revenue/total`);
  }

  getByRange(start: string, end: string): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.base}/admin/range`, {
      params: { start, end }
    });
  }
}