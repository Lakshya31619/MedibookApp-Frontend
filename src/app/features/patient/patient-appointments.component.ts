import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentSummary, SlotSummary } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, ConfirmModalComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-serif text-navy-700">My Appointments</h1>
          <a routerLink="/patient/browse" class="btn-primary text-sm py-2">+ Book New</a>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'upcoming'" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'upcoming' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            Upcoming ({{ upcoming.length }})
          </button>
          <button (click)="tab = 'past'; loadPast()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'past' ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            Past
          </button>
        </div>

        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="card animate-pulse h-24"></div>
            }
          </div>
        }

        <!-- Upcoming -->
        @if (!loading && tab === 'upcoming') {
          @if (upcoming.length === 0) {
            <div class="card text-center py-12 text-gray-400">
              <div class="text-4xl mb-3">📅</div>
              <p>No upcoming appointments</p>
              <a routerLink="/patient/browse" class="btn-primary inline-block mt-4 text-sm py-2">Find a Doctor</a>
            </div>
          }
          <div class="space-y-4">
            @for (appt of upcoming; track appt.appointmentId) {
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
                    <div class="flex gap-2 flex-shrink-0">
                      <button (click)="openReschedule(appt)" class="btn-secondary text-sm py-2">Reschedule</button>
                      <button (click)="openCancel(appt)" class="btn-danger text-sm py-2">Cancel</button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Past -->
        @if (!loading && tab === 'past') {
          <div class="space-y-4">
            @for (appt of past; track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div class="flex items-center gap-2 mb-1">
                      <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                    </div>
                    <p class="font-semibold text-gray-900">{{ appt.serviceType }}</p>
                    <p class="text-sm text-gray-500">{{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }}</p>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-sidebar-layout>

    <!-- Cancel Modal -->
    <app-confirm-modal
      [open]="cancelModal"
      title="Cancel Appointment"
      message="Are you sure you want to cancel this appointment?"
      confirmText="Yes, Cancel"
      cancelText="Keep It"
      [danger]="true"
      [requireReason]="true"
      reasonLabel="Reason for cancellation"
      (confirmed)="confirmCancel($event)"
      (cancelled)="cancelModal = false">
    </app-confirm-modal>

    <!-- Reschedule Modal -->
    @if (rescheduleModal && rescheduleAppt) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="rescheduleModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 page-enter max-h-[90vh] overflow-y-auto">
          <h3 class="text-xl font-serif text-navy-700 mb-5">Reschedule Appointment</h3>

          <!-- Date strip -->
          <div class="flex gap-2 overflow-x-auto pb-2 mb-4">
            @for (day of dateStrip; track day.iso) {
              <button (click)="loadRescheduleSlots(day.iso, rescheduleAppt!.providerId)"
                class="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[55px]"
                [ngClass]="rescheduleDate === day.iso ? 'border-navy-700 bg-navy-700 text-white' : 'border-gray-200 text-gray-600'">
                <span class="text-xs">{{ day.dayName }}</span>
                <span class="text-base font-bold">{{ day.day }}</span>
              </button>
            }
          </div>

          @if (rescheduleSlots.length > 0) {
            <div class="grid grid-cols-3 gap-2 mb-4">
              @for (slot of rescheduleSlots; track slot.slotId) {
                <button (click)="rescheduleSlotId = slot.slotId"
                  class="py-2 px-3 rounded-lg text-sm border-2 transition-all"
                  [ngClass]="rescheduleSlotId === slot.slotId ? 'border-navy-700 bg-navy-700 text-white' : 'border-gray-200 text-gray-700'">
                  {{ slot.startTime | formatTime }}
                </button>
              }
            </div>
          }

          <div class="flex gap-3 justify-end">
            <button class="btn-secondary" (click)="rescheduleModal = false">Cancel</button>
            <button class="btn-primary" [disabled]="!rescheduleSlotId || rescheduling" (click)="confirmReschedule()">
              {{ rescheduling ? 'Rescheduling…' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PatientAppointmentsComponent implements OnInit {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private scheduleService = inject(ScheduleService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'info', route: '/patient/dashboard' },
    { label: 'Find Doctors', iconName: 'user', route: '/patient/browse' },
    { label: 'My Appointments', iconName: 'calendar', route: '/patient/appointments' },
    { label: 'Profile', iconName: 'user', route: '/patient/profile' },
  ];

  tab: 'upcoming' | 'past' = 'upcoming';
  upcoming: AppointmentSummary[] = [];
  past: AppointmentSummary[] = [];
  loading = true;

  cancelModal = false;
  cancelAppt: AppointmentSummary | null = null;

  rescheduleModal = false;
  rescheduleAppt: AppointmentSummary | null = null;
  rescheduleDate = '';
  rescheduleSlots: SlotSummary[] = [];
  rescheduleSlotId = '';
  rescheduling = false;

  dateStrip: { iso: string; day: number; dayName: string }[] = [];

  ngOnInit(): void {
    this.buildDateStrip();
    const userId = this.auth.currentUser()?.userId!;
    this.apptService.getPatientUpcoming(userId).subscribe({
      next: (a) => { this.upcoming = a; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadPast(): void {
    if (this.past.length) return;
    const userId = this.auth.currentUser()?.userId!;
    this.apptService.getPatientAppointments(userId).subscribe({
      next: (all) => {
        this.past = all.filter(a => a.status !== 'SCHEDULED');
      }
    });
  }

  openCancel(appt: AppointmentSummary): void {
    this.cancelAppt = appt;
    this.cancelModal = true;
  }

  confirmCancel(reason: string): void {
    this.cancelModal = false;
    this.apptService.cancel(this.cancelAppt!.appointmentId, reason).subscribe({
      next: () => {
        this.upcoming = this.upcoming.filter(a => a.appointmentId !== this.cancelAppt!.appointmentId);
        this.toast.success('Appointment cancelled.');
      },
      error: () => this.toast.error('Failed to cancel.')
    });
  }

  openReschedule(appt: AppointmentSummary): void {
    this.rescheduleAppt = appt;
    this.rescheduleModal = true;
    this.rescheduleSlots = [];
    this.rescheduleSlotId = '';
  }

  loadRescheduleSlots(date: string, providerId: string): void {
    this.rescheduleDate = date;
    this.scheduleService.getAvailableByDate(providerId, date).subscribe({
      next: (s) => this.rescheduleSlots = s
    });
  }

  confirmReschedule(): void {
    this.rescheduling = true;
    this.apptService.reschedule(this.rescheduleAppt!.appointmentId, this.rescheduleSlotId).subscribe({
      next: () => {
        this.rescheduling = false;
        this.rescheduleModal = false;
        this.toast.success('Appointment rescheduled!');
        const idx = this.upcoming.findIndex(a => a.appointmentId === this.rescheduleAppt!.appointmentId);
        if (idx !== -1) this.upcoming[idx] = { ...this.upcoming[idx], slotId: this.rescheduleSlotId } as any;
      },
      error: () => { this.rescheduling = false; this.toast.error('Reschedule failed.'); }
    });
  }

  buildDateStrip(): void {
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      this.dateStrip.push({
        iso: d.toISOString().split('T')[0],
        day: d.getDate(),
        dayName: d.toLocaleString('default', { weekday: 'short' }),
      });
    }
  }
}
