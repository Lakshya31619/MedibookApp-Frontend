import { Component, OnInit, OnDestroy, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationResponse } from '../../core/notification.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="relative">

      <!-- Bell button -->
      <button
        (click)="toggle()"
        class="relative p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">

        <!-- Bell SVG -->
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
        </svg>

        <!-- Unread badge -->
        @if (unreadCount() > 0) {
          <span class="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {{ unreadCount() > 9 ? '9+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown panel -->
      @if (open()) {
        <div class="fixed w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden" 
             style="left: calc(256px + 20px); top: 60px;">

          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 class="font-semibold text-gray-800 text-sm">Notifications</h3>
            @if (unreadCount() > 0) {
              <button
                (click)="markAllRead()"
                class="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                Mark all read
              </button>
            }
          </div>

          <!-- List -->
          <div class="max-h-80 overflow-y-auto divide-y divide-gray-50">

            @if (loading()) {
              <div class="py-8 flex justify-center">
                <div class="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }

            @if (!loading() && notifications().length === 0) {
              <div class="py-10 text-center text-gray-400">
                <div class="text-3xl mb-2">🔔</div>
                <p class="text-sm">No notifications yet</p>
              </div>
            }

            @for (n of recentNotifications(); track n.notificationId) {
              <div
                class="px-4 py-3 flex gap-3 cursor-pointer transition-colors"
                [class.bg-emerald-50]="!n.isRead"
                [class.hover:bg-gray-50]="n.isRead"
                [class.hover:bg-emerald-100]="!n.isRead"
                (click)="markRead(n)">

                <!-- Dot indicator -->
                <div class="flex-shrink-0 mt-1">
                  @if (!n.isRead) {
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                  } @else {
                    <div class="w-2 h-2 rounded-full bg-gray-200"></div>
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">{{ n.title }}</p>
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ n.message }}</p>
                  <p class="text-[10px] text-gray-400 mt-1">{{ timeAgo(n.sentAt) }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Footer -->
          <div class="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <a
              [routerLink]="notificationsRoute()"
              (click)="open.set(false)"
              class="text-xs text-center block text-emerald-600 hover:text-emerald-700 font-medium py-1 transition-colors">
              View all notifications
            </a>
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificationService);
  private auth         = inject(AuthService);

  notifications = this.notifService.notifications;
  unreadCount   = this.notifService.unreadCount;
  open          = signal(false);
  loading       = signal(false);
  
  // Show only latest 10 in dropdown
  recentNotifications = computed(() => this.notifications().slice(0, 10));

  private pollInterval: any;

  ngOnInit(): void {
    this.load();
    // Poll every 30 seconds for new notifications (safe polling only)
    this.pollInterval = setInterval(() => this.pollForNew(), 30_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
  }

  private pollForNew(): void {
    const userId = this.auth.currentUser()?.userId;
    if (!userId) return;
    this.notifService.pollForNewNotifications(Number(userId)).subscribe({
      error: () => {} // Silent fail on poll errors
    });
  }

  notificationsRoute(): string {
    const role = this.auth.currentUser()?.role?.toLowerCase();
    return `/${role}/notifications`;
  }

  toggle(): void {
    this.open.update(v => !v);
    if (this.open()) {
      this.load();
    }
  }

  load(): void {
    const userId = this.auth.currentUser()?.userId;
    if (!userId) return;

    this.loading.set(true);
    this.notifService.getByRecipient(Number(userId)).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
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

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  // Close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const el = event.target as HTMLElement;
    if (!el.closest('app-notification-bell')) {
      this.open.set(false);
    }
  }
}
