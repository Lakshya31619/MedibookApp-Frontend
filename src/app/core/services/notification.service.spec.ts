import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService } from './notification.service';
import {
  NotificationResponse, SendNotificationRequest,
  AppointmentEventRequest, PaymentEventRequest, ProviderEventRequest,
  BulkNotificationRequest, BulkSendResult,
} from '../notification.models';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/notifications`;

  const mockNotification: NotificationResponse = {
    notificationId: 1,
    recipientId: 2,
    type: 'APPOINTMENT_BOOKED',
    title: 'Appointment Confirmed',
    message: 'Your appointment is booked for June 1',
    channel: 'APP',
    relatedId: 10,
    relatedType: 'APPOINTMENT',
    isRead: false,
    sentAt: '2026-06-01T09:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService],
    });
    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── Initial state ─────────────────────────────────────────────────────────

  it('should initialize with empty notifications and zero unread count', () => {
    expect(service.notifications()).toEqual([]);
    expect(service.unreadCount()).toBe(0);
  });

  // ── getByRecipient ────────────────────────────────────────────────────────

  it('should GET /notifications/recipient/:id and update cache', () => {
    service.getByRecipient(2).subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/recipient/2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockNotification]);

    expect(service.notifications().length).toBe(1);
    expect(service.unreadCount()).toBe(1);
  });

  it('should preserve local read state when server returns unread item', () => {
    // Seed the cache with a locally-marked-read notification
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification]);

    // Mark it read locally
    service.markAsRead(1).subscribe();
    httpMock.expectOne(`${base}/1/read`).flush({ message: 'Read', notificationId: 1 });

    expect(service.notifications()[0].isRead).toBeTrue();
    expect(service.unreadCount()).toBe(0);

    // Now server returns it as unread (lag) — local read state should win
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([{ ...mockNotification, isRead: false }]);

    expect(service.notifications()[0].isRead).toBeTrue();
  });

  // ── getUnread ─────────────────────────────────────────────────────────────

  it('should GET /notifications/unread/:id', () => {
    service.getUnread(2).subscribe(res => {
      expect(res.every(n => !n.isRead)).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/unread/2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockNotification]);
  });

  // ── getUnreadCount ────────────────────────────────────────────────────────

  it('should GET /notifications/unread/:id/count', () => {
    service.getUnreadCount(2).subscribe(res => {
      expect(res.unreadCount).toBe(3);
    });

    const req = httpMock.expectOne(`${base}/unread/2/count`);
    expect(req.request.method).toBe('GET');
    req.flush({ recipientId: 2, unreadCount: 3 });
  });

  // ── pollForNewNotifications ───────────────────────────────────────────────

  it('should update cache only when new items arrive during polling', () => {
    // Prime the cache
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification]);

    const beforeCount = service.notifications().length;

    // Poll — same notifications, no new items
    service.pollForNewNotifications(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification]);

    expect(service.notifications().length).toBe(beforeCount);
  });

  it('should add new notifications to cache during poll when new items found', () => {
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification]);

    const newNotification: NotificationResponse = {
      ...mockNotification,
      notificationId: 2,
      title: 'Another notification',
    };

    service.pollForNewNotifications(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification, newNotification]);

    expect(service.notifications().length).toBe(2);
  });

  // ── markAsRead ────────────────────────────────────────────────────────────

  it('should PUT to /notifications/:id/read and update cache', () => {
    // Prime cache
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification]);

    service.markAsRead(1).subscribe(res => {
      expect(res.notificationId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1/read`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Marked as read', notificationId: 1 });

    expect(service.notifications()[0].isRead).toBeTrue();
    expect(service.unreadCount()).toBe(0);
  });

  // ── markAllRead ───────────────────────────────────────────────────────────

  it('should PUT to /notifications/read-all/:id and mark all cache items read', () => {
    const notifications = [
      mockNotification,
      { ...mockNotification, notificationId: 2, isRead: false },
    ];
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush(notifications);

    expect(service.unreadCount()).toBe(2);

    service.markAllRead(2).subscribe(res => {
      expect(res.recipientId).toBe(2);
    });

    const req = httpMock.expectOne(`${base}/read-all/2`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'All read', recipientId: 2 });

    expect(service.unreadCount()).toBe(0);
    expect(service.notifications().every(n => n.isRead)).toBeTrue();
  });

  // ── delete ────────────────────────────────────────────────────────────────

  it('should DELETE /notifications/:id and remove from cache', () => {
    service.getByRecipient(2).subscribe();
    httpMock.expectOne(`${base}/recipient/2`).flush([mockNotification]);

    service.delete(1).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Deleted' });

    expect(service.notifications().length).toBe(0);
  });

  // ── send ──────────────────────────────────────────────────────────────────

  it('should POST to /notifications/send', () => {
    const body: SendNotificationRequest = {
      recipientId: 2,
      type: 'GENERAL',
      title: 'Test',
      message: 'Hello',
      channels: ['APP'],
    };

    service.send(body).subscribe(res => {
      expect(res.notificationId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/send`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockNotification);
  });

  // ── sendAppointmentEvent ──────────────────────────────────────────────────

  it('should POST to /notifications/events/appointment', () => {
    const event: AppointmentEventRequest = {
      eventType: 'APPOINTMENT_BOOKED',
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      appointmentDate: '2026-06-01',
      appointmentTime: '09:00',
    };

    service.sendAppointmentEvent(event).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/events/appointment`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Event sent' });
  });

  // ── sendPaymentEvent ──────────────────────────────────────────────────────

  it('should POST to /notifications/events/payment', () => {
    const event: PaymentEventRequest = {
      eventType: 'PAYMENT_RECEIVED',
      paymentId: 1,
      patientId: 2,
      adminId: 99,
      amount: 500,
    };

    service.sendPaymentEvent(event).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/events/payment`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Payment event sent' });
  });

  // ── sendProviderEvent ─────────────────────────────────────────────────────

  it('should POST to /notifications/events/provider', () => {
    const event: ProviderEventRequest = {
      eventType: 'PROVIDER_APPROVED',
      providerId: 3,
      providerName: 'Dr. Alice',
    };

    service.sendProviderEvent(event).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/events/provider`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Provider event sent' });
  });

  // ── getAll (Admin) ────────────────────────────────────────────────────────

  it('should GET /notifications/all', () => {
    service.getAll().subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([mockNotification]);
  });

  // ── sendBulk ──────────────────────────────────────────────────────────────

  it('should POST to /notifications/bulk', () => {
    const body: BulkNotificationRequest = {
      recipientIds: [1, 2, 3],
      type: 'GENERAL',
      title: 'System Maintenance',
      message: 'Scheduled maintenance at midnight',
      channels: ['APP', 'EMAIL'],
    };

    service.sendBulk(body).subscribe(res => {
      expect(res.totalSent).toBe(3);
      expect(res.failed).toBe(0);
    });

    const req = httpMock.expectOne(`${base}/bulk`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ totalSent: 3, failed: 0, message: 'Bulk sent' });
  });

  // ── cleanup ───────────────────────────────────────────────────────────────

  it('should DELETE /notifications/admin/cleanup/:daysOld with default 30 days', () => {
    service.cleanup().subscribe(res => {
      expect(res.deleted).toBe(15);
    });

    const req = httpMock.expectOne(`${base}/admin/cleanup/30`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Cleaned up', deleted: 15 });
  });

  it('should DELETE /notifications/admin/cleanup/:daysOld with custom days', () => {
    service.cleanup(60).subscribe();

    const req = httpMock.expectOne(`${base}/admin/cleanup/60`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Cleaned up', deleted: 5 });
  });
});