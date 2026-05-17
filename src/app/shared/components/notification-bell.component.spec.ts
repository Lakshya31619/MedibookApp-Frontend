import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { NotificationBellComponent } from './notification-bell.component';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationResponse } from '../../core/notification.models';
import { signal } from '@angular/core';

const mockNotif: NotificationResponse = {
  notificationId: 1, recipientId: 2,
  type: 'APPOINTMENT_BOOKED', title: 'Appointment Booked',
  message: 'Your appointment is confirmed.', channel: 'APP',
  relatedId: 10, relatedType: 'APPOINTMENT',
  isRead: false, sentAt: new Date().toISOString(),
};

describe('NotificationBellComponent', () => {
  let component: NotificationBellComponent;
  let fixture: ComponentFixture<NotificationBellComponent>;
  let notifSpy: jasmine.SpyObj<NotificationService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    const notifSignal = signal<NotificationResponse[]>([]);
    notifSpy = jasmine.createSpyObj('NotificationService',
      ['getByRecipient', 'markAsRead', 'markAllRead', 'pollForNewNotifications'], {
        notifications: notifSignal.asReadonly(),
        unreadCount: jasmine.createSpy().and.returnValue(0),
      });
    notifSpy.getByRecipient.and.returnValue(of([]));
    notifSpy.markAsRead.and.returnValue(of({ message: 'ok', notificationId: 1 }));
    notifSpy.markAllRead.and.returnValue(of({ message: 'ok', recipientId: 2 }));
    notifSpy.pollForNewNotifications.and.returnValue(of([]));

    authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: jasmine.createSpy().and.returnValue({
        userId: '2', fullName: 'Test User', email: 'test@example.com',
        role: 'PATIENT', active: true, createdAt: '',
      }),
    });

    await TestBed.configureTestingModule({
      imports: [NotificationBellComponent, RouterTestingModule],
      providers: [
        { provide: NotificationService, useValue: notifSpy },
        { provide: AuthService, useValue: authSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call getByRecipient on init', () => {
    expect(notifSpy.getByRecipient).toHaveBeenCalledWith(2);
  });

  it('should start with dropdown closed', () => {
    expect(component.open()).toBeFalse();
  });

  it('should toggle open state on toggle()', () => {
    component.toggle();
    expect(component.open()).toBeTrue();
    component.toggle();
    expect(component.open()).toBeFalse();
  });

  it('should call load() when toggle opens the dropdown', () => {
    const loadSpy = spyOn(component, 'load').and.callThrough();
    component.toggle();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('should call markAsRead when markRead() called on unread notification', () => {
    component.markRead({ ...mockNotif, isRead: false });
    expect(notifSpy.markAsRead).toHaveBeenCalledWith(1);
  });

  it('should NOT call markAsRead when markRead() called on already-read notification', () => {
    notifSpy.markAsRead.calls.reset();
    component.markRead({ ...mockNotif, isRead: true });
    expect(notifSpy.markAsRead).not.toHaveBeenCalled();
  });

  it('should call markAllRead() with userId', () => {
    component.markAllRead();
    expect(notifSpy.markAllRead).toHaveBeenCalledWith(2);
  });

  it('notificationsRoute should return correct path for PATIENT', () => {
    expect(component.notificationsRoute()).toBe('/patient/notifications');
  });

  // ── timeAgo ───────────────────────────────────────────────────────────────

  it('timeAgo should return "just now" for very recent times', () => {
    const recent = new Date().toISOString();
    expect(component.timeAgo(recent)).toBe('just now');
  });

  it('timeAgo should return minutes ago', () => {
    const past = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(component.timeAgo(past)).toBe('5m ago');
  });

  it('timeAgo should return hours ago', () => {
    const past = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(component.timeAgo(past)).toBe('3h ago');
  });

  it('timeAgo should return days ago', () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(component.timeAgo(past)).toBe('2d ago');
  });

  it('should close dropdown when clicking outside', () => {
    component.open.set(true);
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: document.createElement('div'), // not inside app-notification-bell
    });
    component.onDocumentClick(event);
    expect(component.open()).toBeFalse();
  });

  it('should do nothing if no userId in markAllRead()', () => {
    (authSpy as any).currentUser.and.returnValue(null);
    notifSpy.markAllRead.calls.reset();
    component.markAllRead();
    expect(notifSpy.markAllRead).not.toHaveBeenCalled();
  });
});