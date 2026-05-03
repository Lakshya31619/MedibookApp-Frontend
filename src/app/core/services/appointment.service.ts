import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppointmentResponse, AppointmentSummary, AppointmentCount, BookAppointmentRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private base = `${environment.apiUrl}/api/appointments`;

  constructor(private http: HttpClient) {}

  book(body: BookAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.base}/book`, body);
  }

  getById(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.base}/${id}`);
  }

  // Patient
  getPatientAppointments(patientId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/patient/${patientId}`);
  }

  getPatientUpcoming(patientId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/patient/${patientId}/upcoming`);
  }

  cancel(id: string, reason?: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/cancel`, { reason });
  }

  reschedule(id: string, newSlotId: string, reason?: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/reschedule`, { newSlotId, reason });
  }

  // Provider/Admin
  getProviderAppointments(providerId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}`);
  }

  getProviderToday(providerId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}/today`);
  }

  getProviderUpcoming(providerId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}/upcoming`);
  }

  getProviderByDate(providerId: string, date: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/provider/${providerId}/date`, { params: { date } });
  }

  complete(id: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/complete`, null);
  }

  markNoShow(id: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/no-show`, null);
  }

  getProviderCount(providerId: string): Observable<AppointmentCount> {
    return this.http.get<AppointmentCount>(`${this.base}/provider/${providerId}/count`);
  }

  // Admin
  getAll(): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/all`);
  }

  updateStatus(id: string, value: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/${id}/status`, null, { params: { value } });
  }
}