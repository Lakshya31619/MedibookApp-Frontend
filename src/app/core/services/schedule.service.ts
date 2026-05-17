import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { SlotResponse, SlotSummary, RecurringSlotRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private base = `${environment.apiUrl}/api/slots`;
  private slotCache$ = new Map<string, Observable<SlotResponse>>();
  private slotSummaryCache$ = new Map<string, Observable<SlotSummary[]>>();
  private slotResponseListCache$ = new Map<string, Observable<SlotResponse[]>>();
  private slotCountCache$ = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  // Public
  getAvailableByDate(providerId: number, date: string): Observable<SlotSummary[]> {
    const key = `${providerId}:${date}`;
    if (!this.slotSummaryCache$.has(key)) {
      this.slotSummaryCache$.set(
        key,
        this.http.get<SlotSummary[]>(`${this.base}/available/${providerId}`, { params: { date } }).pipe(shareReplay(1))
      );
    }
    return this.slotSummaryCache$.get(key)!;
  }

  getFutureAvailable(providerId: number): Observable<SlotSummary[]> {
    const key = `future:${providerId}`;
    if (!this.slotSummaryCache$.has(key)) {
      this.slotSummaryCache$.set(
        key,
        this.http.get<SlotSummary[]>(`${this.base}/provider/${providerId}/available`).pipe(shareReplay(1))
      );
    }
    return this.slotSummaryCache$.get(key)!
  }

  getSlotCount(providerId: number): Observable<{ providerId: number; availableSlots: number }> {
    const key = `count:${providerId}`;
    if (!this.slotCountCache$.has(key)) {
      this.slotCountCache$.set(
        key,
        this.http.get<{ providerId: number; availableSlots: number }>(`${this.base}/provider/${providerId}/count`).pipe(shareReplay(1))
      );
    }
    return this.slotCountCache$.get(key)!;
  }

  getSlot(slotId: number): Observable<SlotResponse> {
    const key = `slot:${slotId}`;
    if (!this.slotCache$.has(key)) {
      this.slotCache$.set(
        key,
        this.http.get<SlotResponse>(`${this.base}/${slotId}`).pipe(shareReplay(1))
      );
    }
    return this.slotCache$.get(key)!;
  }

  // Provider/Admin
  getProviderSlots(providerId: number): Observable<SlotResponse[]> {
    const key = `prov:${providerId}:all`;
    if (!this.slotResponseListCache$.has(key)) {
      this.slotResponseListCache$.set(
        key,
        this.http.get<SlotResponse[]>(`${this.base}/provider/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.slotResponseListCache$.get(key)!;
  }

  getProviderSlotsInRange(providerId: number, startDate: string, endDate: string): Observable<SlotResponse[]> {
    const key = `prov:${providerId}:${startDate}:${endDate}`;
    if (!this.slotResponseListCache$.has(key)) {
      this.slotResponseListCache$.set(
        key,
        this.http.get<SlotResponse[]>(`${this.base}/provider/${providerId}/range`, { params: { startDate, endDate } }).pipe(shareReplay(1))
      );
    }
    return this.slotResponseListCache$.get(key)!
  }

  addSlot(body: { providerId: number; date: string; startTime: string; endTime: string }): Observable<SlotResponse> {
    this.clearCache();
    return this.http.post<SlotResponse>(`${this.base}/add`, body);
  }

  addBulkSlots(body: { providerId: number; slots: { date: string; startTime: string; endTime: string }[] }): Observable<{ slotsCreated: number; slotsSkipped: number; message: string }> {
    this.clearCache();
    return this.http.post<{ slotsCreated: number; slotsSkipped: number; message: string }>(`${this.base}/bulk`, body);
  }

  addRecurringSlots(body: RecurringSlotRequest): Observable<{ slotsCreated: number; slotsSkipped: number; message: string }> {
    this.clearCache();
    return this.http.post<{ slotsCreated: number; slotsSkipped: number; message: string }>(`${this.base}/recurring`, body);
  }

  blockSlot(slotId: number): Observable<SlotResponse> {
    this.clearCache();
    return this.http.put<SlotResponse>(`${this.base}/${slotId}/block`, null);
  }

  unblockSlot(slotId: number): Observable<SlotResponse> {
    this.clearCache();
    return this.http.put<SlotResponse>(`${this.base}/${slotId}/unblock`, null);
  }

  deleteSlot(slotId: number): Observable<{ message: string }> {
    this.clearCache();
    return this.http.delete<{ message: string }>(`${this.base}/${slotId}`);
  }

  // Admin
  purgeSlots(): Observable<{ message: string }> {
    this.clearCache();
    return this.http.post<{ message: string }>(`${this.base}/admin/purge`, null);
  }

  private clearCache(): void {
    this.slotCache$.clear();
    this.slotSummaryCache$.clear();
    this.slotResponseListCache$.clear();
    this.slotCountCache$.clear();
  }
}