import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PaymentResponse, PaymentSummary, ProcessPaymentRequest,
  EarningsSummary, Invoice, PlatformRevenue,
  RazorpayOrderRequest, RazorpayOrderResponse, RazorpayVerifyRequest,
} from '../payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private base = `${environment.apiUrl}/api/payments`;
  private paymentCache$ = new Map<string, Observable<PaymentResponse>>();
  private paymentSummaryCache$ = new Map<string, Observable<PaymentSummary[]>>();
  private paymentResponseListCache$ = new Map<string, Observable<PaymentResponse[]>>();
  private paymentStatusCache$ = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  // ── Patient endpoints ──────────────────────────────────────────────────────

  /** Legacy / CASH flow only — still used when paymentMode === 'CASH' */
  processPayment(body: ProcessPaymentRequest): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(`${this.base}/process`, body);
  }

  getByAppointment(appointmentId: number): Observable<PaymentResponse> {
    const key = `apt:${appointmentId}`;
    if (!this.paymentCache$.has(key)) {
      this.paymentCache$.set(
        key,
        this.http.get<PaymentResponse>(`${this.base}/appointment/${appointmentId}`).pipe(shareReplay(1))
      );
    }
    return this.paymentCache$.get(key)!;
  }

  getByPatient(patientId: number): Observable<PaymentSummary[]> {
    const key = `pat:${patientId}`;
    if (!this.paymentSummaryCache$.has(key)) {
      this.paymentSummaryCache$.set(
        key,
        this.http.get<PaymentSummary[]>(`${this.base}/patient/${patientId}`).pipe(shareReplay(1))
      );
    }
    return this.paymentSummaryCache$.get(key)!
  }

  getPatientTotal(patientId: number): Observable<{ patientId: number; totalSpending: number; currency: string }> {
    const key = `total:${patientId}`;
    if (!this.paymentStatusCache$.has(key)) {
      this.paymentStatusCache$.set(
        key,
        this.http.get<{ patientId: number; totalSpending: number; currency: string }>(
          `${this.base}/patient/${patientId}/total`
        ).pipe(shareReplay(1))
      );
    }
    return this.paymentStatusCache$.get(key)!;
  }

  getStatus(appointmentId: number): Observable<{ appointmentId: number; status: string }> {
    const key = `status:${appointmentId}`;
    if (!this.paymentStatusCache$.has(key)) {
      this.paymentStatusCache$.set(
        key,
        this.http.get<{ appointmentId: number; status: string }>(
          `${this.base}/status/${appointmentId}`
        ).pipe(shareReplay(1))
      );
    }
    return this.paymentStatusCache$.get(key)!;
  }

  getInvoice(appointmentId: number): Observable<Invoice> {
    const key = `inv:${appointmentId}`;
    if (!this.paymentStatusCache$.has(key)) {
      this.paymentStatusCache$.set(
        key,
        this.http.get<Invoice>(`${this.base}/invoice/${appointmentId}`).pipe(shareReplay(1))
      );
    }
    return this.paymentStatusCache$.get(key)!;
  }

  /** Issues a refund — routes through Razorpay for online payments */
  refund(appointmentId: number, reason?: string): Observable<{ message: string; status: string; refundTransactionId: string; notes: string }> {
    this.clearCache();
    return this.http.post<{ message: string; status: string; refundTransactionId: string; notes: string }>(
      `${this.base}/razorpay/refund/${appointmentId}`,
      { reason }
    );
  }

  // ── Razorpay checkout flow ─────────────────────────────────────────────────

  /**
   * Step 1: Ask the backend to create a Razorpay order.
   * Returns the orderId + publishable key needed to open the checkout popup.
   */
  createRazorpayOrder(body: RazorpayOrderRequest): Observable<RazorpayOrderResponse> {
    return this.http.post<RazorpayOrderResponse>(`${this.base}/razorpay/create-order`, body);
  }

  /**
   * Step 2: After the user completes payment in the popup, send the
   * Razorpay callback tokens to the backend for signature verification.
   * The backend marks the payment PAID only if the signature is valid.
   */
  verifyRazorpayPayment(body: RazorpayVerifyRequest): Observable<PaymentResponse> {
    this.clearCache();
    return this.http.post<PaymentResponse>(`${this.base}/razorpay/verify`, body);
  }

  // ── Provider endpoints ─────────────────────────────────────────────────────

  getByProvider(providerId: number): Observable<PaymentSummary[]> {
    const key = `prov:${providerId}`;
    if (!this.paymentSummaryCache$.has(key)) {
      this.paymentSummaryCache$.set(
        key,
        this.http.get<PaymentSummary[]>(`${this.base}/provider/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.paymentSummaryCache$.get(key)!
  }

  getEarnings(providerId: number): Observable<EarningsSummary> {
    const key = `earn:${providerId}`;
    if (!this.paymentStatusCache$.has(key)) {
      this.paymentStatusCache$.set(
        key,
        this.http.get<EarningsSummary>(`${this.base}/earnings/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.paymentStatusCache$.get(key)!;
  }

  confirmCash(appointmentId: number): Observable<{ message: string; appointmentId: number; status: string; paidAt: string }> {
    this.clearCache();
    return this.http.post<{ message: string; appointmentId: number; status: string; paidAt: string }>(
      `${this.base}/confirm-cash/${appointmentId}`, null
    );
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  getAll(): Observable<PaymentResponse[]> {
    const key = 'all';
    if (!this.paymentResponseListCache$.has(key)) {
      this.paymentResponseListCache$.set(
        key,
        this.http.get<PaymentResponse[]>(`${this.base}/all`).pipe(shareReplay(1))
      );
    }
    return this.paymentResponseListCache$.get(key)!
  }

  updateStatus(paymentId: number, value: string): Observable<{ message: string; paymentId: number }> {
    this.clearCache();
    return this.http.put<{ message: string; paymentId: number }>(
      `${this.base}/admin/${paymentId}/status`, null, { params: { value } }
    );
  }

  getPlatformRevenue(): Observable<PlatformRevenue> {
    const key = 'platform-revenue';
    if (!this.paymentStatusCache$.has(key)) {
      this.paymentStatusCache$.set(
        key,
        this.http.get<PlatformRevenue>(`${this.base}/revenue`).pipe(shareReplay(1))
      );
    }
    return this.paymentStatusCache$.get(key)!;
  }

  getTotalRevenue(): Observable<{ totalRevenue: number; currency: string }> {
    const key = 'total-revenue';
    if (!this.paymentStatusCache$.has(key)) {
      this.paymentStatusCache$.set(
        key,
        this.http.get<{ totalRevenue: number; currency: string }>(`${this.base}/revenue/total`).pipe(shareReplay(1))
      );
    }
    return this.paymentStatusCache$.get(key)!;
  }

  getByRange(start: string, end: string): Observable<PaymentResponse[]> {
    const key = `range:${start}:${end}`;
    if (!this.paymentResponseListCache$.has(key)) {
      this.paymentResponseListCache$.set(
        key,
        this.http.get<PaymentResponse[]>(`${this.base}/admin/range`, {
          params: { start, end }
        }).pipe(shareReplay(1))
      );
    }
    return this.paymentResponseListCache$.get(key)!
  }

  private clearCache(): void {
    this.paymentCache$.clear();
    this.paymentSummaryCache$.clear();
    this.paymentResponseListCache$.clear();
    this.paymentStatusCache$.clear();
  }
}