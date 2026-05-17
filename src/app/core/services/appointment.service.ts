import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AppointmentResponse, AppointmentSummary, AppointmentCount, BookAppointmentRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private base = `${environment.apiUrl}/api/appointments`;
  private appointmentCache$ = new Map<string, Observable<AppointmentResponse>>();
  private appointmentListCache$ = new Map<string, Observable<AppointmentSummary[]>>();
  private appointmentCountCache$ = new Map<string, Observable<AppointmentCount>>();

  constructor(private http: HttpClient) {}

  book(body: BookAppointmentRequest): Observable<AppointmentResponse> {
    this.clearCache();
    return this.http.post<AppointmentResponse>(`${this.base}/book`, body);
  }

  getById(id: number): Observable<AppointmentResponse> {
    const key = `apt:${id}`;
    if (!this.appointmentCache$.has(key)) {
      this.appointmentCache$.set(
        key,
        this.http.get<AppointmentResponse>(`${this.base}/${id}`).pipe(shareReplay(1))
      );
    }
    return this.appointmentCache$.get(key)!;
  }

  // Patient
  getPatientAppointments(patientId: number): Observable<AppointmentSummary[]> {
    const key = `pat:${patientId}:all`;
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/patient/${patientId}`).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  getPatientUpcoming(patientId: number): Observable<AppointmentSummary[]> {
    const key = `pat:${patientId}:upcoming`;
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/patient/${patientId}/upcoming`).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  cancel(id: number, reason?: string): Observable<AppointmentResponse> {
    this.clearCache();
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/cancel`, { reason });
  }

  reschedule(id: number, newSlotId: number, reason?: string): Observable<AppointmentResponse> {
    this.clearCache();
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/reschedule`, { newSlotId, reason });
  }

  // Provider/Admin
  getProviderAppointments(providerId: number): Observable<AppointmentSummary[]> {
    const key = `prov:${providerId}:all`;
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  getProviderToday(providerId: number): Observable<AppointmentSummary[]> {
    const key = `prov:${providerId}:today`;
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}/today`).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  getProviderUpcoming(providerId: number): Observable<AppointmentSummary[]> {
    const key = `prov:${providerId}:upcoming`;
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}/upcoming`).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  getProviderByDate(providerId: number, date: string): Observable<AppointmentSummary[]> {
    const key = `prov:${providerId}:${date}`;
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}/date`, { params: { date } }).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  complete(id: number): Observable<AppointmentResponse> {
    this.clearCache();
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/complete`, null);
  }

  markNoShow(id: number): Observable<AppointmentResponse> {
    this.clearCache();
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/no-show`, null);
  }

  getProviderCount(providerId: number): Observable<AppointmentCount> {
    const key = `cnt:${providerId}`;
    if (!this.appointmentCountCache$.has(key)) {
      this.appointmentCountCache$.set(
        key,
        this.http.get<AppointmentCount>(`${this.base}/provider/${providerId}/count`).pipe(shareReplay(1))
      );
    }
    return this.appointmentCountCache$.get(key)!;
  }

  // Admin
  getAll(): Observable<AppointmentSummary[]> {
    const key = 'all';
    if (!this.appointmentListCache$.has(key)) {
      this.appointmentListCache$.set(
        key,
        this.http.get<AppointmentSummary[]>(`${this.base}/all`).pipe(shareReplay(1))
      );
    }
    return this.appointmentListCache$.get(key)!;
  }

  updateStatus(id: number, value: string): Observable<AppointmentResponse> {
    this.clearCache();
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/status`, null, { params: { value } });
  }

  private clearCache(): void {
    this.appointmentCache$.clear();
    this.appointmentListCache$.clear();
    this.appointmentCountCache$.clear();
  }
}