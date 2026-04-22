import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentSummary } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent, ConfirmModalComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <h1 class="text-3xl font-serif text-navy-700 mb-6">Appointments</h1>

        <!-- Tabs -->
        <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'today'" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'today' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'">Today</button>
          <button (click)="tab = 'all'; loadAll()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'all' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500'">All</button>
        </div>

        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-20"></div> }
          </div>
        }

        @if (!loading) {
          <div class="space-y-4">
            @for (appt of (tab === 'today' ? today : all); track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                      <span class="text-xs text-gray-400">{{ appt.modeOfConsultation === 'VIDEO' ? '📹 Video' : '🏥 In-Person' }}</span>
                    </div>
                    <p class="font-semibold text-gray-900">{{ appt.serviceType }}</p>
                    <p class="text-sm text-gray-500">{{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }} – {{ appt.endTime | formatTime }}</p>
                  </div>
                  @if (appt.status === 'SCHEDULED') {
                    <div class="flex gap-2">
                      <button (click)="markComplete(appt)" class="btn-emerald text-sm py-2">Complete</button>
                      <button (click)="markNoShow(appt)" class="btn-secondary text-sm py-2">No-Show</button>
                    </div>
                  }
                </div>
              </div>
            }
            @if ((tab === 'today' ? today : all).length === 0) {
              <div class="card text-center py-12 text-gray-400">
                <div class="text-3xl mb-2">📅</div>
                <p>No appointments found.</p>
              </div>
            }
          </div>
        }
      </div>
    </app-sidebar-layout>
  `
})
export class ProviderAppointmentsComponent implements OnInit {
  private auth = inject(AuthService);
  private providerService = inject(ProviderService);
  private apptService = inject(AppointmentService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'info', route: '/provider/dashboard' },
    { label: 'Appointments', iconName: 'calendar', route: '/provider/appointments' },
    { label: 'Slot Management', iconName: 'calendar', route: '/provider/slots' },
    { label: 'My Profile', iconName: 'user', route: '/provider/profile' },
  ];

  tab: 'today' | 'all' = 'today';
  today: AppointmentSummary[] = [];
  all: AppointmentSummary[] = [];
  loading = true;
  providerId = '';

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerService.getMyProfile(userId).subscribe({
      next: (p) => {
        this.providerId = p.providerId;
        this.apptService.getProviderToday(p.providerId).subscribe({
          next: (a) => { this.today = a; this.loading = false; },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  loadAll(): void {
    if (this.all.length || !this.providerId) return;
    this.apptService.getProviderAppointments(this.providerId).subscribe({
      next: (a) => this.all = a
    });
  }

  markComplete(appt: AppointmentSummary): void {
    this.apptService.complete(appt.appointmentId).subscribe({
      next: () => {
        this.updateStatus(appt.appointmentId, 'COMPLETED');
        this.toast.success('Appointment completed.');
      },
      error: () => this.toast.error('Failed.')
    });
  }

  markNoShow(appt: AppointmentSummary): void {
    this.apptService.markNoShow(appt.appointmentId).subscribe({
      next: () => {
        this.updateStatus(appt.appointmentId, 'NO_SHOW');
        this.toast.info('Marked as no-show.');
      },
      error: () => this.toast.error('Failed.')
    });
  }

  private updateStatus(id: string, status: string): void {
    const update = (list: AppointmentSummary[]) => {
      const idx = list.findIndex(a => a.appointmentId === id);
      if (idx !== -1) list[idx] = { ...list[idx], status: status as any };
    };
    update(this.today);
    update(this.all);
  }
}
