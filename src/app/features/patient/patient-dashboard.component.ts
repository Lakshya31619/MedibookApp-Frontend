import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { RecordService } from '../../core/services/record.service';
import { AppointmentSummary } from '../../core/models';
import { RecordResponse } from '../../core/record.models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

interface FollowUp {
  record: RecordResponse;
  followUpDate: Date;
  daysUntil: number;      // negative = overdue
  urgency: 'overdue' | 'soon' | 'upcoming';
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent, IconComponent,
            StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-serif text-navy-700">Good {{ greeting }}, {{ firstName }}!</h1>
          <p class="text-gray-500 mt-1">Here's your health overview</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          @for (stat of stats; track stat.label) {
            <div class="card">
              <div class="text-2xl mb-1">{{ stat.icon }}</div>
              <p class="text-2xl font-bold text-navy-700">{{ stat.value }}</p>
              <p class="text-gray-500 text-xs mt-0.5">{{ stat.label }}</p>
            </div>
          }
        </div>

        <!-- Follow-up reminders -->
        @if (!recordsLoading && followUps.length > 0) {
          <div class="mb-8">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xl font-serif text-navy-700">Follow-up Reminders</h2>
              <a routerLink="/patient/records"
                 class="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1">
                View records
                <app-icon name="chevron-right" [size]="14"></app-icon>
              </a>
            </div>
            <div class="space-y-3">
              @for (fu of followUps; track fu.record.recordId) {

                <!-- Overdue -->
                @if (fu.urgency === 'overdue') {
                  <div class="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div class="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <app-icon name="alert-triangle" [size]="18" class="text-red-600"></app-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <span class="text-xs font-bold text-red-700 uppercase tracking-wide">Overdue</span>
                        <span class="text-xs text-red-500">{{ fu.daysUntil * -1 }} day{{ fu.daysUntil < -1 ? 's' : '' }} ago</span>
                      </div>
                      <p class="font-semibold text-red-900 text-sm truncate">{{ fu.record.diagnosis }}</p>
                      <p class="text-xs text-red-600 mt-0.5">
                        Scheduled for {{ fu.followUpDate | date:'mediumDate' }}
                      </p>
                    </div>
                    <a routerLink="/patient/records"
                       class="flex-shrink-0 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 border border-red-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Book now
                    </a>
                  </div>
                }

                <!-- Due soon (≤ 7 days) -->
                @if (fu.urgency === 'soon') {
                  <div class="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div class="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <app-icon name="clock" [size]="18" class="text-amber-600"></app-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <span class="text-xs font-bold text-amber-700 uppercase tracking-wide">Due Soon</span>
                        <span class="text-xs text-amber-600">
                          {{ fu.daysUntil === 0 ? 'Today' : 'In ' + fu.daysUntil + ' day' + (fu.daysUntil > 1 ? 's' : '') }}
                        </span>
                      </div>
                      <p class="font-semibold text-amber-900 text-sm truncate">{{ fu.record.diagnosis }}</p>
                      <p class="text-xs text-amber-700 mt-0.5">
                        {{ fu.followUpDate | date:'mediumDate' }}
                        @if (fu.record.followUpReminderSent) {
                          · <span class="inline-flex items-center gap-1">
                              <app-icon name="check" [size]="11"></app-icon>Reminder sent
                            </span>
                        }
                      </p>
                    </div>
                    <a routerLink="/patient/browse"
                       class="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Book now
                    </a>
                  </div>
                }

                <!-- Upcoming (> 7 days) -->
                @if (fu.urgency === 'upcoming') {
                  <div class="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
                    <div class="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <app-icon name="calendar" [size]="18" class="text-teal-600"></app-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <span class="text-xs font-bold text-teal-700 uppercase tracking-wide">Follow-up</span>
                        <span class="text-xs text-teal-600">In {{ fu.daysUntil }} days</span>
                      </div>
                      <p class="font-semibold text-teal-900 text-sm truncate">{{ fu.record.diagnosis }}</p>
                      <p class="text-xs text-teal-700 mt-0.5">{{ fu.followUpDate | date:'mediumDate' }}</p>
                    </div>
                    <a routerLink="/patient/browse"
                       class="flex-shrink-0 text-xs font-semibold text-teal-700 bg-teal-100 hover:bg-teal-200 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Book now
                    </a>
                  </div>
                }

              }
            </div>
          </div>
        }

        <!-- Follow-up loading skeleton -->
        @if (recordsLoading) {
          <div class="mb-8 space-y-3">
            @for (i of [1,2]; track i) {
              <div class="h-20 bg-gray-100 rounded-xl animate-pulse"></div>
            }
          </div>
        }

        <!-- Upcoming appointments -->
        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-xl font-serif text-navy-700">Upcoming Appointments</h2>
            <a routerLink="/patient/appointments" class="text-sm text-emerald-600 font-medium hover:underline">View all</a>
          </div>

          @if (loading) {
            <div class="space-y-3">
              @for (i of [1,2,3]; track i) {
                <div class="animate-pulse h-16 bg-gray-100 rounded-xl"></div>
              }
            </div>
          }

          @if (!loading && upcoming.length === 0) {
            <div class="text-center py-8 text-gray-400">
              <div class="text-4xl mb-3">📅</div>
              <p>No upcoming appointments</p>
              <a routerLink="/patient/browse" class="btn-primary inline-block mt-4 text-sm py-2">Find a Doctor</a>
            </div>
          }

          @if (!loading) {
            <div class="divide-y divide-gray-100">
              @for (appt of upcoming.slice(0, 5); track appt.appointmentId) {
                <div class="py-4 flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900">{{ appt.serviceType }}</p>
                    <p class="text-sm text-gray-500">{{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ appt.modeOfConsultation === 'VIDEO' ? '📹 Video' : '🏥 In-Person' }}</p>
                  </div>
                  <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </app-sidebar-layout>
  `
})
export class PatientDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private appointmentService = inject(AppointmentService);
  private recordService = inject(RecordService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  upcoming: AppointmentSummary[] = [];
  all: AppointmentSummary[] = [];
  loading = true;

  records: RecordResponse[] = [];
  recordsLoading = true;
  followUps: FollowUp[] = [];

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  get firstName(): string {
    return this.auth.currentUser()?.fullName.split(' ')[0] || 'there';
  }

  get completedCount(): number {
    return this.all.filter(a => a.status === 'COMPLETED').length;
  }

  get cancelledCount(): number {
    return this.all.filter(a => a.status === 'CANCELLED').length;
  }

  get stats() {
    return [
      { icon: '📅', value: this.upcoming.length, label: 'Upcoming' },
      { icon: '✅', value: this.completedCount, label: 'Completed' },
      { icon: '❌', value: this.cancelledCount, label: 'Cancelled' },
      { icon: '🏥', value: this.all.length, label: 'Total Visits' },
    ];
  }

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.userId!;

    this.appointmentService.getPatientUpcoming(userId).subscribe({
      next: (a) => { this.upcoming = a; this.loading = false; },
      error: () => { this.loading = false; }
    });

    this.appointmentService.getPatientAppointments(userId).subscribe({
      next: (a) => { this.all = a; },
      error: () => {}
    });

    this.recordService.getByPatient(userId).subscribe({
      next: (records) => {
        this.records = records;
        this.followUps = this.buildFollowUps(records);
        this.recordsLoading = false;
      },
      error: () => { this.recordsLoading = false; }
    });
  }

  private buildFollowUps(records: RecordResponse[]): FollowUp[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return records
      .filter(r => r.followUpDate !== null)
      .map(r => {
        const followUpDate = new Date(r.followUpDate!);
        followUpDate.setHours(0, 0, 0, 0);
        const daysUntil = Math.round(
          (followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const urgency: FollowUp['urgency'] =
          daysUntil < 0  ? 'overdue'  :
          daysUntil <= 7 ? 'soon'     : 'upcoming';
        return { record: r, followUpDate, daysUntil, urgency };
      })
      // Sort: overdue first (most overdue first), then soonest upcoming
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }
}