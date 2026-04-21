import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AppointmentResponse, AppointmentSummary, AppointmentCount, BookAppointmentRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private base = environment.appointmentServiceUrl;

  constructor(private http: HttpClient) {}

  book(body: BookAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.base}/appointments/book`, body);
  }

  getById(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.base}/appointments/${id}`);
  }

  // Patient
  getPatientAppointments(patientId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/patient/${patientId}`);
  }

  getPatientUpcoming(patientId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/patient/${patientId}/upcoming`);
  }

  cancel(id: string, reason?: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/appointments/${id}/cancel`, { reason });
  }

  reschedule(id: string, newSlotId: string, reason?: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/appointments/${id}/reschedule`, { newSlotId, reason });
  }

  // Provider/Admin
  getProviderAppointments(providerId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/provider/${providerId}`);
  }

  getProviderToday(providerId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/provider/${providerId}/today`);
  }

  getProviderUpcoming(providerId: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/provider/${providerId}/upcoming`);
  }

  getProviderByDate(providerId: string, date: string): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/provider/${providerId}/date`, { params: { date } });
  }

  complete(id: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/appointments/${id}/complete`, null);
  }

  markNoShow(id: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/appointments/${id}/no-show`, null);
  }

  getProviderCount(providerId: string): Observable<AppointmentCount> {
    return this.http.get<AppointmentCount>(`${this.base}/appointments/provider/${providerId}/count`);
  }

  // Admin
  getAll(): Observable<AppointmentSummary[]> {
    return this.http.get<AppointmentSummary[]>(`${this.base}/appointments/all`);
  }

  updateStatus(id: string, value: string): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${this.base}/appointments/${id}/status`, null, { params: { value } });
  }
}
