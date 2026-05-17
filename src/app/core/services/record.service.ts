import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CreateRecordRequest, UpdateRecordRequest,
  RecordResponse
} from '../record.models';

@Injectable({ providedIn: 'root' })
export class RecordService {
  private base = `${environment.apiUrl}/api/records`;
  private recordCache$ = new Map<string, Observable<RecordResponse>>();
  private recordListCache$ = new Map<string, Observable<any[]>>();
  private recordCountCache$ = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  // ── Provider ───────────────────────────────────────────────────────────────

  createRecord(body: CreateRecordRequest): Observable<RecordResponse> {
    this.clearCache();
    return this.http.post<RecordResponse>(`${this.base}`, body);
  }

  getByProvider(providerId: number | string): Observable<RecordResponse[]> {
    const key = `prov:${providerId}`;
    if (!this.recordListCache$.has(key)) {
      this.recordListCache$.set(
        key,
        this.http.get<RecordResponse[]>(`${this.base}/provider/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.recordListCache$.get(key)!;
  }

  updateRecord(recordId: number, body: UpdateRecordRequest): Observable<RecordResponse> {
    this.clearCache();
    return this.http.put<RecordResponse>(`${this.base}/${recordId}`, body);
  }

  attachDocument(recordId: number, attachmentUrl: string): Observable<RecordResponse> {
    this.clearCache();
    return this.http.put<RecordResponse>(
      `${this.base}/adminattach`,
      { recordId, attachmentUrl }
    );
  }

  // ── Patient ────────────────────────────────────────────────────────────────

  getByPatient(patientId: number | string): Observable<RecordResponse[]> {
    const key = `pat:${patientId}`;
    if (!this.recordListCache$.has(key)) {
      this.recordListCache$.set(
        key,
        this.http.get<RecordResponse[]>(`${this.base}/patient/${patientId}`).pipe(shareReplay(1))
      );
    }
    return this.recordListCache$.get(key)!;
  }

  getByAppointment(appointmentId: number): Observable<RecordResponse> {
    const key = `apt:${appointmentId}`;
    if (!this.recordCache$.has(key)) {
      this.recordCache$.set(
        key,
        this.http.get<RecordResponse>(`${this.base}/appointment/${appointmentId}`).pipe(shareReplay(1))
      );
    }
    return this.recordCache$.get(key)!;
  }

  getRecordCount(patientId: number | string): Observable<{ count: number }> {
    const key = `count:${patientId}`;
    if (!this.recordCountCache$.has(key)) {
      this.recordCountCache$.set(
        key,
        this.http.get<{ count: number }>(`${this.base}/patient/${patientId}/count`).pipe(shareReplay(1))
      );
    }
    return this.recordCountCache$.get(key)!;
  }

  // ── Any authenticated ──────────────────────────────────────────────────────

  getById(recordId: number): Observable<RecordResponse> {
    const key = `id:${recordId}`;
    if (!this.recordCache$.has(key)) {
      this.recordCache$.set(
        key,
        this.http.get<RecordResponse>(`${this.base}/${recordId}`).pipe(shareReplay(1))
      );
    }
    return this.recordCache$.get(key)!;
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAll(): Observable<RecordResponse[]> {
    const key = 'all';
    if (!this.recordListCache$.has(key)) {
      this.recordListCache$.set(
        key,
        this.http.get<RecordResponse[]>(`${this.base}`).pipe(shareReplay(1))
      );
    }
    return this.recordListCache$.get(key)!;
  }

  getAllWithFollowUp(): Observable<RecordResponse[]> {
    const key = 'followup';
    if (!this.recordListCache$.has(key)) {
      this.recordListCache$.set(
        key,
        this.http.get<RecordResponse[]>(`${this.base}/followup`).pipe(shareReplay(1))
      );
    }
    return this.recordListCache$.get(key)!;
  }

  processFollowUpReminders(): Observable<{ sent: number }> {
    this.clearCache();
    return this.http.post<{ sent: number }>(`${this.base}/followup/process`, null);
  }

  deleteRecord(recordId: number): Observable<{ message: string }> {
    this.clearCache();
    return this.http.delete<{ message: string }>(`${this.base}/${recordId}`);
  }

  private clearCache(): void {
    this.recordCache$.clear();
    this.recordListCache$.clear();
    this.recordCountCache$.clear();
  }
}