import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { AppointmentSummary } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
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
  private appointmentService = inject(AppointmentService);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'info', route: '/patient/dashboard' },
    { label: 'Find Doctors', iconName: 'user', route: '/patient/browse' },
    { label: 'My Appointments', iconName: 'calendar', route: '/patient/appointments' },
    { label: 'Profile', iconName: 'user', route: '/patient/profile' },
  ];

  upcoming: AppointmentSummary[] = [];
  loading = true;

  get greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }

  get firstName(): string {
    return this.auth.currentUser()?.fullName.split(' ')[0] || 'there';
  }

  get stats() {
    return [
      { icon: '📅', value: this.upcoming.length, label: 'Upcoming' },
      { icon: '✅', value: '–', label: 'Completed' },
      { icon: '❌', value: '–', label: 'Cancelled' },
      { icon: '🏥', value: '–', label: 'Total Visits' },
    ];
  }

  ngOnInit(): void {
    const userId = this.auth.currentUser()?.userId!;
    this.appointmentService.getPatientUpcoming(userId).subscribe({
      next: (a) => { this.upcoming = a; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
