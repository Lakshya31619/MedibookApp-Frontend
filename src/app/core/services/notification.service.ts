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
  private base = environment.notificationServiceUrl;
  
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
      `${this.base}/notifications/recipient/${recipientId}`
    ).pipe(
      tap(list => {
        // Merge with existing cache to preserve local read state
        const existing = this.notificationsCache();
        const existingMap = new Map(existing.map(n => [n.notificationId, n]));
        const merged = list.map(item => {
          const local = existingMap.get(item.notificationId);
          // Keep local read state if it's marked as read (user just marked it)
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
      `${this.base}/notifications/unread/${recipientId}`
    );
  }

  getUnreadCount(recipientId: number): Observable<UnreadCount> {
    return this.http.get<UnreadCount>(
      `${this.base}/notifications/unread/${recipientId}/count`
    );
  }

  // Safe polling method that only updates the full list if there are new notifications
  pollForNewNotifications(recipientId: number): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(
      `${this.base}/notifications/recipient/${recipientId}`
    ).pipe(
      tap(list => {
        // Only update if there are new items not in cache
        const existing = this.notificationsCache();
        const existingIds = new Set(existing.map(n => n.notificationId));
        const hasNewItems = list.some(item => !existingIds.has(item.notificationId));
        
        if (hasNewItems) {
          // Merge intelligently: keep local read state for existing items
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
      `${this.base}/notifications/${notificationId}/read`, null
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
      `${this.base}/notifications/read-all/${recipientId}`, null
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
      `${this.base}/notifications/${notificationId}`
    ).pipe(
      tap(() => {
        this.notificationsCache.update(list =>
          list.filter(n => n.notificationId !== notificationId)
        );
      })
    );
  }

  // ── Internal / service-to-service endpoints ─────────────────────────────────

  /**
   * Low-level single send.
   * Prefer the typed event methods below for lifecycle events.
   */
  send(body: SendNotificationRequest): Observable<NotificationResponse> {
    return this.http.post<NotificationResponse>(
      `${this.base}/notifications/send`, body
    );
  }

  /**
   * Fire an appointment lifecycle event.
   * The backend will automatically notify the correct parties.
   *
   * Event types: APPOINTMENT_BOOKED, APPOINTMENT_CANCELLED,
   *              APPOINTMENT_COMPLETED, APPOINTMENT_NO_SHOW,
   *              APPOINTMENT_RESCHEDULED, APPOINTMENT_REMINDER
   */
  sendAppointmentEvent(event: AppointmentEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/notifications/events/appointment`, event
    );
  }

  /**
   * Fire a payment event.
   * Notifies both the patient (receipt) and the admin.
   *
   * Event types: PAYMENT_RECEIVED, PAYMENT_REFUNDED
   */
  sendPaymentEvent(event: PaymentEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/notifications/events/payment`, event
    );
  }

  /**
   * Fire a provider approval / rejection event.
   * Notifies the provider (and sends email if providerEmail is given).
   *
   * Event types: PROVIDER_APPROVED, PROVIDER_REJECTED
   */
  sendProviderEvent(event: ProviderEventRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.base}/notifications/events/provider`, event
    );
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────────

  getAll(): Observable<NotificationResponse[]> {
    return this.http.get<NotificationResponse[]>(`${this.base}/notifications/all`);
  }

  sendBulk(body: BulkNotificationRequest): Observable<BulkSendResult> {
    return this.http.post<BulkSendResult>(
      `${this.base}/notifications/bulk`, body
    );
  }

  cleanup(daysOld = 30): Observable<{ message: string; deleted: number }> {
    return this.http.delete<{ message: string; deleted: number }>(
      `${this.base}/notifications/admin/cleanup/${daysOld}`
    );
  }
}