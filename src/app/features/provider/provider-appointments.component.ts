import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentSummary } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent, IconComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="mb-6">
          <h1 class="page-title">Appointments</h1>
          <p class="page-subtitle">Manage your patient appointments</p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'today'"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [ngClass]="tab === 'today' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500'">
            Today ({{ today.length }})
          </button>
          <button (click)="tab = 'all'; loadAll()"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [ngClass]="tab === 'all' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500'">
            All
          </button>
        </div>

        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-24"></div> }
          </div>
        }

        @if (!loading) {
          @if ((tab === 'today' ? today : all).length === 0) {
            <div class="card text-center py-14">
              <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <app-icon name="calendar" [size]="22" class="text-slate-400"></app-icon>
              </div>
              <p class="text-slate-400">No appointments found.</p>
            </div>
          }
          <div class="space-y-3">
            @for (appt of (tab === 'today' ? today : all); track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         [ngClass]="appt.status === 'SCHEDULED' ? 'bg-navy-50' : 'bg-slate-100'">
                      <app-icon [name]="appt.modeOfConsultation === 'VIDEO' ? 'video' : 'stethoscope'"
                                [size]="18"
                                [ngClass]="appt.status === 'SCHEDULED' ? 'text-navy-600' : 'text-slate-400'">
                      </app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5">
                        <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                        <!-- Payment status badge -->
                        @if (paymentStatuses[appt.appointmentId]) {
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full border"
                                [ngClass]="paymentStatuses[appt.appointmentId] === 'PAID'
                                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                           : paymentStatuses[appt.appointmentId] === 'PENDING'
                                           ? 'bg-amber-50 text-amber-700 border-amber-200'
                                           : 'bg-slate-100 text-slate-500 border-slate-200'">
                            {{ paymentStatuses[appt.appointmentId] }}
                          </span>
                        }
                      </div>
                      <p class="font-semibold text-slate-900 text-sm">{{ appt.serviceType }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }} – {{ appt.endTime | formatTime }}
                      </p>
                    </div>
                  </div>

                  @if (appt.status === 'SCHEDULED') {
                    <div class="flex flex-wrap gap-2 flex-shrink-0">
                      <!-- Confirm cash if payment is PENDING -->
                      @if (paymentStatuses[appt.appointmentId] === 'PENDING') {
                        <button (click)="confirmCash(appt)"
                                class="btn-success text-xs py-1.5 px-3">
                          <app-icon name="dollar-sign" [size]="13"></app-icon>
                          Collect Cash
                        </button>
                      }
                      <button (click)="markComplete(appt)" class="btn-primary text-xs py-1.5 px-3">
                        <app-icon name="check" [size]="13"></app-icon>
                        Complete
                      </button>
                      <button (click)="markNoShow(appt)" class="btn-secondary text-xs py-1.5 px-3">
                        No-Show
                      </button>
                    </div>
                  }
                </div>
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
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard',       iconName: 'home',        route: '/provider/dashboard' },
    { label: 'Appointments',    iconName: 'calendar',    route: '/provider/appointments' },
    { label: 'Slot Management', iconName: 'grid',        route: '/provider/slots' },
    { label: 'Earnings',        iconName: 'trending-up', route: '/provider/earnings' },
    { label: 'My Profile',      iconName: 'user',        route: '/provider/profile' },
  ];

  tab: 'today' | 'all' = 'today';
  today: AppointmentSummary[] = [];
  all: AppointmentSummary[] = [];
  loading = true;
  providerId = '';
  paymentStatuses: Record<string, string> = {};

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerService.getMyProfile(userId).subscribe({
      next: (p) => {
        this.providerId = p.providerId;
        this.apptService.getProviderToday(p.providerId).subscribe({
          next: (a) => {
            this.today = a;
            this.loading = false;
            this.loadPaymentStatuses(a);
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  loadAll(): void {
    if (this.all.length || !this.providerId) return;
    this.apptService.getProviderAppointments(this.providerId).subscribe({
      next: (a) => { this.all = a; this.loadPaymentStatuses(a); }
    });
  }

  loadPaymentStatuses(appointments: AppointmentSummary[]): void {
    appointments.forEach(a => {
      this.paymentService.getStatus(Number(a.appointmentId)).subscribe({
        next: (res) => { this.paymentStatuses[a.appointmentId] = res.status; },
        error: () => {}
      });
    });
  }

  markComplete(appt: AppointmentSummary): void {
    this.apptService.complete(appt.appointmentId).subscribe({
      next: () => { this.updateStatus(appt.appointmentId, 'COMPLETED'); this.toast.success('Marked as completed.'); },
      error: () => this.toast.error('Failed.')
    });
  }

  markNoShow(appt: AppointmentSummary): void {
    this.apptService.markNoShow(appt.appointmentId).subscribe({
      next: () => { this.updateStatus(appt.appointmentId, 'NO_SHOW'); this.toast.info('Marked as no-show.'); },
      error: () => this.toast.error('Failed.')
    });
  }

  confirmCash(appt: AppointmentSummary): void {
    this.paymentService.confirmCash(Number(appt.appointmentId)).subscribe({
      next: () => {
        this.paymentStatuses[appt.appointmentId] = 'PAID';
        this.toast.success('Cash payment confirmed!');
      },
      error: (err) => this.toast.error(err.error?.error || 'Failed to confirm cash.')
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