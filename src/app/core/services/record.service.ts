import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRecordRequest, UpdateRecordRequest,
  RecordResponse
} from '../record.models';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private base = `${environment.apiUrl}/api/records`;

  constructor(private http: HttpClient) {}

  // ── Provider ───────────────────────────────────────────────────────────────

  createRecord(body: CreateRecordRequest): Observable<RecordResponse> {
    return this.http.post<RecordResponse>(`${this.base}`, body);
  }

  getByProvider(providerId: number | string): Observable<RecordResponse[]> {
    return this.http.get<RecordResponse[]>(`${this.base}/provider/${providerId}`);
  }

  updateRecord(recordId: number, body: UpdateRecordRequest): Observable<RecordResponse> {
    return this.http.put<RecordResponse>(`${this.base}/${recordId}`, body);
  }

  attachDocument(recordId: number, attachmentUrl: string): Observable<RecordResponse> {
    return this.http.put<RecordResponse>(
      `${this.base}/adminattach`,
      { recordId, attachmentUrl }
    );
  }

  // ── Patient ────────────────────────────────────────────────────────────────

  getByPatient(patientId: number | string): Observable<RecordResponse[]> {
    return this.http.get<RecordResponse[]>(`${this.base}/patient/${patientId}`);
  }

  getByAppointment(appointmentId: number): Observable<RecordResponse> {
    return this.http.get<RecordResponse>(`${this.base}/appointment/${appointmentId}`);
  }

  getRecordCount(patientId: number | string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/patient/${patientId}/count`);
  }

  // ── Any authenticated ──────────────────────────────────────────────────────

  getById(recordId: number): Observable<RecordResponse> {
    return this.http.get<RecordResponse>(`${this.base}/${recordId}`);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAll(): Observable<RecordResponse[]> {
    return this.http.get<RecordResponse[]>(`${this.base}`);
  }

  getAllWithFollowUp(): Observable<RecordResponse[]> {
    return this.http.get<RecordResponse[]>(`${this.base}/followup`);
  }

  processFollowUpReminders(): Observable<{ sent: number }> {
    return this.http.post<{ sent: number }>(`${this.base}/followup/process`, null);
  }

  deleteRecord(recordId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${recordId}`);
  }
}