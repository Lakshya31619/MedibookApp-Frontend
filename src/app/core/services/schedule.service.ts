import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SlotResponse, SlotSummary, RecurringSlotRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private base = `${environment.apiUrl}/api/slots`;

  constructor(private http: HttpClient) {}

  // Public
  getAvailableByDate(providerId: string, date: string): Observable<SlotSummary[]> {
    return this.http.get<SlotSummary[]>(`${this.base}/available/${providerId}`, { params: { date } });
  }

  getFutureAvailable(providerId: string): Observable<SlotSummary[]> {
    return this.http.get<SlotSummary[]>(`${this.base}/provider/${providerId}/available`);
  }

  getSlotCount(providerId: string): Observable<{ providerId: string; availableSlots: number }> {
    return this.http.get<{ providerId: string; availableSlots: number }>(`${this.base}/provider/${providerId}/count`);
  }

  getSlot(slotId: string): Observable<SlotResponse> {
    return this.http.get<SlotResponse>(`${this.base}/${slotId}`);
  }

  // Provider/Admin
  getProviderSlots(providerId: string): Observable<SlotResponse[]> {
    return this.http.get<SlotResponse[]>(`${this.base}/provider/${providerId}`);
  }

  getProviderSlotsInRange(providerId: string, startDate: string, endDate: string): Observable<SlotResponse[]> {
    return this.http.get<SlotResponse[]>(`${this.base}/provider/${providerId}/range`, { params: { startDate, endDate } });
  }

  addSlot(body: { providerId: string; date: string; startTime: string; endTime: string }): Observable<SlotResponse> {
    return this.http.post<SlotResponse>(`${this.base}/add`, body);
  }

  addBulkSlots(body: { providerId: string; slots: { date: string; startTime: string; endTime: string }[] }): Observable<{ slotsCreated: number; slotsSkipped: number; message: string }> {
    return this.http.post<{ slotsCreated: number; slotsSkipped: number; message: string }>(`${this.base}/bulk`, body);
  }

  addRecurringSlots(body: RecurringSlotRequest): Observable<{ slotsCreated: number; slotsSkipped: number; message: string }> {
    return this.http.post<{ slotsCreated: number; slotsSkipped: number; message: string }>(`${this.base}/recurring`, body);
  }

  blockSlot(slotId: string): Observable<SlotResponse> {
    return this.http.put<SlotResponse>(`${this.base}/${slotId}/block`, null);
  }

  unblockSlot(slotId: string): Observable<SlotResponse> {
    return this.http.put<SlotResponse>(`${this.base}/${slotId}/unblock`, null);
  }

  deleteSlot(slotId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${slotId}`);
  }

  // Admin
  purgeSlots(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/admin/purge`, null);
  }
}