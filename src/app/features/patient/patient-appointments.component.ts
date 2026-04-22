import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentSummary, SlotSummary } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, IconComponent,
            ConfirmModalComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="page-title">My Appointments</h1>
            <p class="page-subtitle">Manage your upcoming and past visits</p>
          </div>
          <a routerLink="/patient/browse" class="btn-primary text-sm">
            <app-icon name="plus" [size]="15"></app-icon>
            Book New
          </a>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'upcoming'" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'upcoming' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Upcoming ({{ upcoming.length }})
          </button>
          <button (click)="tab = 'past'; loadPast()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'past' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Past
          </button>
        </div>

        <!-- Loading skeleton -->
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
            <div class="card text-center py-14">
              <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <app-icon name="calendar" [size]="22" class="text-slate-400"></app-icon>
              </div>
              <p class="font-medium text-slate-600 mb-1">No upcoming appointments</p>
              <p class="text-sm text-slate-400 mb-5">Book your first appointment to get started.</p>
              <a routerLink="/patient/browse" class="btn-primary inline-flex text-sm">Find a Doctor</a>
            </div>
          }
          <div class="space-y-3">
            @for (appt of upcoming; track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon [name]="appt.modeOfConsultation === 'VIDEO' ? 'video' : 'stethoscope'"
                                [size]="18" class="text-navy-600"></app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5">
                        <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                      </div>
                      <p class="font-semibold text-slate-900 text-sm">{{ appt.serviceType }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }} – {{ appt.endTime | formatTime }}
                      </p>
                    </div>
                  </div>
                  @if (appt.status === 'SCHEDULED') {
                    <div class="flex gap-2 flex-shrink-0">
                      <button (click)="openReschedule(appt)" class="btn-secondary text-xs py-1.5 px-3">
                        <app-icon name="refresh-cw" [size]="13"></app-icon>
                        Reschedule
                      </button>
                      <button (click)="openCancel(appt)" class="btn-danger text-xs py-1.5 px-3">
                        <app-icon name="x" [size]="13"></app-icon>
                        Cancel
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Past -->
        @if (!loading && tab === 'past') {
          @if (past.length === 0) {
            <div class="card text-center py-14">
              <p class="text-slate-400">No past appointments found.</p>
            </div>
          }
          <div class="space-y-3">
            @for (appt of past; track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon name="clipboard" [size]="18" class="text-slate-500"></app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5">
                        <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                      </div>
                      <p class="font-semibold text-slate-900 text-sm">{{ appt.serviceType }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }}
                      </p>
                    </div>
                  </div>
                  <!-- Payment status chip -->
                  @if (paymentStatuses[appt.appointmentId]) {
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
                          [ngClass]="paymentStatuses[appt.appointmentId] === 'PAID'
                                     ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                     : paymentStatuses[appt.appointmentId] === 'REFUNDED'
                                     ? 'bg-blue-50 text-blue-700 border-blue-200'
                                     : 'bg-slate-100 text-slate-500 border-slate-200'">
                      {{ paymentStatuses[appt.appointmentId] }}
                    </span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-sidebar-layout>

    <!-- Cancel Modal — triggers refund automatically -->
    <app-confirm-modal
      [open]="cancelModal"
      title="Cancel Appointment"
      message="This will cancel your appointment. If eligible, a refund will be automatically processed."
      confirmText="Cancel Appointment"
      cancelText="Keep It"
      [danger]="true"
      [requireReason]="true"
      reasonLabel="Reason for cancellation"
      reasonPlaceholder="e.g. Schedule conflict, feeling better…"
      (confirmed)="confirmCancel($event)"
      (cancelled)="cancelModal = false">
    </app-confirm-modal>

    <!-- Reschedule Modal -->
    @if (rescheduleModal && rescheduleAppt) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="rescheduleModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-modal max-w-lg w-full p-6 page-enter max-h-[90vh] overflow-y-auto">
          <h3 class="font-serif text-xl text-navy-800 mb-5">Reschedule Appointment</h3>

          <p class="section-label">Select New Date</p>
          <div class="flex gap-2 overflow-x-auto pb-2 mb-5">
            @for (day of dateStrip; track day.iso) {
              <button (click)="loadRescheduleSlots(day.iso)"
                class="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[56px]"
                [ngClass]="rescheduleDate === day.iso
                  ? 'border-navy-700 bg-navy-700 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                <span class="text-xs font-medium">{{ day.dayName }}</span>
                <span class="text-base font-bold leading-tight">{{ day.day }}</span>
                <span class="text-xs opacity-70">{{ day.month }}</span>
              </button>
            }
          </div>

          @if (rescheduleDate && rescheduleSlots.length === 0) {
            <p class="text-slate-400 text-sm text-center py-4">No available slots for this date.</p>
          }

          @if (rescheduleSlots.length > 0) {
            <p class="section-label">Select Slot</p>
            <div class="grid grid-cols-3 gap-2 mb-5">
              @for (slot of rescheduleSlots; track slot.slotId) {
                <button (click)="rescheduleSlotId = slot.slotId"
                  class="py-2.5 px-3 rounded-lg text-sm border-2 transition-all"
                  [ngClass]="rescheduleSlotId === slot.slotId
                    ? 'border-navy-700 bg-navy-700 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                  {{ slot.startTime | formatTime }}
                </button>
              }
            </div>
          }

          <div class="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button class="btn-secondary" (click)="rescheduleModal = false">Cancel</button>
            <button class="btn-primary" [disabled]="!rescheduleSlotId || rescheduling" (click)="confirmReschedule()">
              @if (rescheduling) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              {{ rescheduling ? 'Rescheduling…' : 'Confirm Reschedule' }}
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
  private paymentService = inject(PaymentService);
  private scheduleService = inject(ScheduleService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard',       iconName: 'home',     route: '/patient/dashboard' },
    { label: 'Find Doctors',    iconName: 'search',   route: '/patient/browse' },
    { label: 'My Appointments', iconName: 'calendar', route: '/patient/appointments' },
    { label: 'Profile',         iconName: 'user',     route: '/patient/profile' },
  ];

  tab: 'upcoming' | 'past' = 'upcoming';
  upcoming: AppointmentSummary[] = [];
  past: AppointmentSummary[] = [];
  loading = true;
  paymentStatuses: Record<string, string> = {};

  cancelModal = false;
  cancelAppt: AppointmentSummary | null = null;

  rescheduleModal = false;
  rescheduleAppt: AppointmentSummary | null = null;
  rescheduleDate = '';
  rescheduleSlots: SlotSummary[] = [];
  rescheduleSlotId = '';
  rescheduling = false;

  dateStrip: { iso: string; day: number; month: string; dayName: string }[] = [];

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
        // Fetch payment status for each past appointment
        this.past.forEach(a => {
          this.paymentService.getStatus(Number(a.appointmentId)).subscribe({
            next: (res) => {
              this.paymentStatuses[a.appointmentId] = res.status;
            },
            error: () => {}
          });
        });
      }
    });
  }

  openCancel(appt: AppointmentSummary): void {
    this.cancelAppt = appt;
    this.cancelModal = true;
  }

  confirmCancel(reason: string): void {
    this.cancelModal = false;
    const appt = this.cancelAppt!;

    // 1. Cancel the appointment
    this.apptService.cancel(appt.appointmentId, reason).subscribe({
      next: () => {
        this.upcoming = this.upcoming.filter(a => a.appointmentId !== appt.appointmentId);
        this.toast.success('Appointment cancelled.');

        // 2. Trigger refund automatically
        this.paymentService.refund(Number(appt.appointmentId), reason).subscribe({
          next: (res) => {
            if (res.status === 'REFUNDED') {
              this.toast.success(`Refund processed. Ref: ${res.refundTransactionId}`);
            } else if (res.notes?.includes('outside')) {
              this.toast.warning('Cancellation outside refund window — no refund issued.');
            } else if (res.notes?.includes('CASH')) {
              this.toast.info('Cash appointment cancelled — no charge was made.');
            }
          },
          error: () => {
            this.toast.warning('Refund could not be processed automatically. Contact support.');
          }
        });
      },
      error: () => this.toast.error('Failed to cancel appointment.')
    });
  }

  openReschedule(appt: AppointmentSummary): void {
    this.rescheduleAppt = appt;
    this.rescheduleModal = true;
    this.rescheduleSlots = [];
    this.rescheduleSlotId = '';
    this.rescheduleDate = '';
  }

  loadRescheduleSlots(date: string): void {
    this.rescheduleDate = date;
    this.scheduleService.getAvailableByDate(this.rescheduleAppt!.providerId, date).subscribe({
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
        // Refresh upcoming list
        const userId = this.auth.currentUser()?.userId!;
        this.apptService.getPatientUpcoming(userId).subscribe(a => this.upcoming = a);
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
        month: d.toLocaleString('default', { month: 'short' }),
        dayName: d.toLocaleString('default', { weekday: 'short' }),
      });
    }
  }
}