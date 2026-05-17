import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  NotificationResponse,
  SendNotificationRequest,
  AppointmentEventRequest,
  PaymentEventRequest,
  ProviderEventRequest,
  BulkNotificationRequest,
  BulkSendResult,
  UnreadCount
} from '../notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/api/notifications`;

  // ── Shared state for all notifications ──
  private notificationsCache = signal<NotificationResponse[]>([]);
  notifications = this.notificationsCache.asReadonly();

  unreadCount = computed(() =>
    this.notificationsCache().filter(n => !n.isRead).length
  );

  constructor(private http: HttpClient) {}

  // ── User endpoints ──────────────────────────────────────────────────────────

  getByRecipient(recipientId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${this.base}/recipient/${recipientId}`
    ).pipe(
      tap(list => {
        const existing = this.notificationsCache();
        const existingMap = new Map(existing.map(n => [n.notificationId, n]));
        const merged = list.map(item => {
          const local = existingMap.get(item.notificationId);
          if (local && local.isRead && !item.isRead) {
            return local;
          }
          return item;
        });
        this.notificationsCache.set(merged);
      })
    );
  }

  getUnread(recipientId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${this.base}/unread/${recipientId}`
    );
  }

  getUnreadCount(recipientId: number): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(
      `${this.base}/unread/${recipientId}/count`
    );
  }

  pollForNewNotifications(recipientId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${this.base}/recipient/${recipientId}`
    ).pipe(
      tap(list => {
        const existing = this.notificationsCache();
        const existingIds = new Set(existing.map(n => n.notificationId));
        const hasNewItems = list.some(item => !existingIds.has(item.notificationId));

        if (hasNewItems) {
          const existingMap = new Map(existing.map(n => [n.notificationId, n]));
          const merged = list.map(item => {
            const local = existingMap.get(item.notificationId);
            if (local && local.isRead && !item.isRead) {
              return local;
            }
            return item;
          });
          this.notificationsCache.set(merged);
        }
      })
    );
  }

  markAsRead(notificationId: number): Observable<{ message: string; notificationId: number }> {
    return this.http.put<{ message: string; notificationId: number }>(
      `${this.base}/${notificationId}/read`, null
    ).pipe(
      tap(() => {
        this.notificationsCache.update(list =>
          list.map(n =>
            n.notificationId === notificationId ? { ...n, isRead: true } : n
          )
        );
      })
    );
  }

  markAllRead(recipientId: number): Observable<{ message: string; recipientId: number }> {
    return this.http.put<{ message: string; recipientId: number }>(
      `${this.base}/read-all/${recipientId}`, null
    ).pipe(
      tap(() => {
        this.notificationsCache.update(list =>
          list.map(n => ({ ...n, isRead: true }))
        );
      })
    );
  }

  delete(notificationId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.base}/${notificationId}`
    ).pipe(
      tap(() => {
        this.notificationsCache.update(list =>
          list.filter(n => n.notificationId !== notificationId)
        );
      })
    );
  }

  // ── Internal / service-to-service endpoints ─────────────────────────────────

  send(body: SendNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.base}/send`, body
    );
  }

  sendAppointmentEvent(event: AppointmentEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/events/appointment`, event
    );
  }

  sendPaymentEvent(event: PaymentEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/events/payment`, event
    );
  }

  sendProviderEvent(event: ProviderEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/events/provider`, event
    );
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  getAll(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.base}/all`);
  }

  sendBulk(body: BulkNotificationRequest): Observable<BulkSendResult> {
    return this.http.post<BulkSendResult>(
      `${this.base}/bulk`, body
    );
  }

  cleanup(daysOld = 30): Observable<{ message: string; deleted: number }> {
    return this.http.delete<{ message: string; deleted: number }>(
      `${this.base}/admin/cleanup/${daysOld}`
    );
  }
}