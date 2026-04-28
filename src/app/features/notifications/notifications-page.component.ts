import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationResponse } from '../../core/notification.models';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-3xl font-serif text-navy-700">Notifications</h1>
            <p class="text-gray-500 mt-1 text-sm">
              @if (unread() > 0) { {{ unread() }} unread } @else { All caught up! }
            </p>
          </div>
          <div class="flex gap-2">
            @if (unread() > 0) {
              <button (click)="markAllRead()" class="btn-secondary text-sm py-2 px-4">
                Mark all read
              </button>
            }
            <button (click)="load()" class="btn-secondary text-sm py-2 px-4">Refresh</button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="flex gap-2 mb-6 flex-wrap">
          @for (tab of tabs; track tab.key) {
            <button
              (click)="activeTab.set(tab.key)"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              [class.bg-navy-700]="activeTab() === tab.key"
              [class.text-white]="activeTab() === tab.key"
              [class.bg-gray-100]="activeTab() !== tab.key"
              [class.text-gray-600]="activeTab() !== tab.key">
              {{ tab.label }}
              @if (tab.key === 'unread' && unread() > 0) {
                <span class="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {{ unread() }}
                </span>
              }
            </button>
          }
        </div>

        <!-- Loading skeleton -->
        @if (loading()) {
          <div class="space-y-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="card animate-pulse">
                <div class="flex gap-4">
                  <div class="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div class="h-3 bg-gray-100 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (!loading() && filtered().length === 0) {
          <div class="card text-center py-16">
            <div class="text-5xl mb-4">{{ activeTab() === 'unread' ? '✅' : '🔔' }}</div>
            <h3 class="text-lg font-semibold text-gray-700">
              {{ activeTab() === 'unread' ? 'All caught up!' : 'No notifications yet' }}
            </h3>
            <p class="text-gray-400 text-sm mt-1">
              {{ activeTab() === 'unread' ? 'No unread notifications.' : 'Notifications will appear here.' }}
            </p>
          </div>
        }

        <!-- Notifications list -->
        @if (!loading() && filtered().length > 0) {
          <div class="space-y-2">
            @for (n of filtered(); track n.notificationId) {
              <div
                class="card flex gap-4 items-start transition-all cursor-pointer hover:shadow-md"
                [class.border-l-4]="!n.isRead"
                [class.border-emerald-500]="!n.isRead"
                (click)="markRead(n)">

                <!-- Icon -->
                <div
                  class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                  [class.bg-emerald-100]="!n.isRead"
                  [class.bg-gray-100]="n.isRead">
                  {{ typeIcon(n.type) }}
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <p class="font-semibold text-gray-800 text-sm" [class.text-navy-700]="!n.isRead">
                      {{ n.title }}
                    </p>
                    <div class="flex items-center gap-2 flex-shrink-0">
                      @if (!n.isRead) {
                        <span class="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
                      }
                      <span class="text-xs text-gray-400 whitespace-nowrap">{{ timeAgo(n.sentAt) }}</span>
                    </div>
                  </div>
                  <p class="text-sm text-gray-600 mt-0.5">{{ n.message }}</p>
                  <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase tracking-wide">
                      {{ n.channel }}
                    </span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide"
                      [class]="typeBadgeClass(n.type)">
                      {{ typeLabel(n.type) }}
                    </span>
                  </div>
                </div>

                <!-- Delete -->
                <button
                  (click)="deleteNotif($event, n)"
                  class="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </app-sidebar-layout>
  `
})
export class NotificationsPageComponent implements OnInit {
  private notifService = inject(NotificationService);
  private auth         = inject(AuthService);

  notifications = this.notifService.notifications;
  loading       = signal(false);
  activeTab     = signal<'all' | 'unread'>('all');

  // ✅ Correct computed() pattern — no broken signal() wrappers
  filtered = computed(() =>
    this.activeTab() === 'unread'
      ? this.notifications().filter(n => !n.isRead)
      : this.notifications()
  );

  unread = computed(() => this.notifications().filter(n => !n.isRead).length);

  tabs = [
    { key: 'all'    as const, label: 'All' },
    { key: 'unread' as const, label: 'Unread' },
  ];

  get navItems(): NavItem[] {
    const role = this.auth.currentUser()?.role?.toLowerCase();
    if (role === 'patient') return [
      { label: 'Dashboard',    iconName: 'home',     route: '/patient/dashboard' },
      { label: 'Appointments', iconName: 'calendar', route: '/patient/appointments' },
      { label: 'Browse',       iconName: 'search',   route: '/patient/browse' },
      { label: 'Profile',      iconName: 'user',     route: '/patient/profile' },
    ];
    if (role === 'provider') return [
      { label: 'Dashboard',    iconName: 'home',     route: '/provider/dashboard' },
      { label: 'Appointments', iconName: 'calendar', route: '/provider/appointments' },
      { label: 'Slots',        iconName: 'clock',    route: '/provider/slots' },
      { label: 'Earnings',     iconName: 'dollar',   route: '/provider/earnings' },
      { label: 'Profile',      iconName: 'user',     route: '/provider/profile' },
    ];
    if (role === 'admin') return [
      { label: 'Dashboard',         iconName: 'home',       route: '/admin/dashboard' },
      { label: 'Pending Approvals', iconName: 'clock',      route: '/admin/pending' },
      { label: 'All Providers',     iconName: 'users',      route: '/admin/providers' },
      { label: 'Reviews',           iconName: 'star',       route: '/admin/reviews' },
      { label: 'Payments',          iconName: 'dollar-sign',route: '/admin/payments' },
      { label: 'My Profile',        iconName: 'user',       route: '/admin/profile' },
    ];
    return [];
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    const userId = this.auth.currentUser()?.userId;
    if (!userId) return;
    this.loading.set(true);
    this.notifService.getByRecipient(Number(userId)).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  markRead(n: NotificationResponse): void {
    if (n.isRead) return;
    this.notifService.markAsRead(n.notificationId).subscribe();
  }

  markAllRead(): void {
    const userId = this.auth.currentUser()?.userId;
    if (!userId) return;
    this.notifService.markAllRead(Number(userId)).subscribe();
  }

  deleteNotif(event: MouseEvent, n: NotificationResponse): void {
    event.stopPropagation();
    this.notifService.delete(n.notificationId).subscribe();
  }

  typeIcon(type: string): string {
    const map: Record<string, string> = {
      APPOINTMENT_BOOKED:              '📅',
      APPOINTMENT_CONFIRMED:           '✅',
      APPOINTMENT_CANCELLED:           '❌',
      APPOINTMENT_RESCHEDULED:         '🔄',
      APPOINTMENT_REMINDER:            '⏰',
      APPOINTMENT_COMPLETED:           '✅',
      APPOINTMENT_NO_SHOW:             '🚫',
      NEW_BOOKING_FOR_PROVIDER:        '📅',
      BOOKING_CANCELLED_FOR_PROVIDER:  '❌',
      PROVIDER_APPROVED:               '🎉',
      PROVIDER_REJECTED:               '⚠️',
      PAYMENT_RECEIVED:                '💳',
      PAYMENT_REFUNDED:                '💰',
      ADMIN_PAYMENT_RECEIVED:          '💰',
      ADMIN_PAYMENT_REFUNDED:          '🔄',
      REVIEW_RECEIVED:                 '⭐',
      GENERAL:                         '🔔',
    };
    return map[type] ?? '🔔';
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      APPOINTMENT_BOOKED:              'Booked',
      APPOINTMENT_CONFIRMED:           'Confirmed',
      APPOINTMENT_CANCELLED:           'Cancelled',
      APPOINTMENT_RESCHEDULED:         'Rescheduled',
      APPOINTMENT_REMINDER:            'Reminder',
      APPOINTMENT_COMPLETED:           'Completed',
      APPOINTMENT_NO_SHOW:             'No Show',
      NEW_BOOKING_FOR_PROVIDER:        'New Booking',
      BOOKING_CANCELLED_FOR_PROVIDER:  'Cancellation',
      PROVIDER_APPROVED:               'Approved',
      PROVIDER_REJECTED:               'Rejected',
      PAYMENT_RECEIVED:                'Payment',
      PAYMENT_REFUNDED:                'Refund',
      ADMIN_PAYMENT_RECEIVED:          'Payment',
      ADMIN_PAYMENT_REFUNDED:          'Refund',
      REVIEW_RECEIVED:                 'Review',
      GENERAL:                         'General',
    };
    return map[type] ?? type.replace(/_/g, ' ');
  }

  typeBadgeClass(type: string): string {
    if (type.includes('CANCELLED') || type.includes('REJECTED') || type.includes('NO_SHOW'))
      return 'bg-red-50 text-red-500';
    if (type.includes('PAYMENT') || type.includes('REFUND'))
      return 'bg-green-50 text-green-600';
    if (type.includes('PROVIDER'))
      return 'bg-purple-50 text-purple-600';
    if (type.includes('REMINDER'))
      return 'bg-yellow-50 text-yellow-600';
    return 'bg-blue-50 text-blue-500';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }
}