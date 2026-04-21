import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProviderResponse, AppointmentSummary, AppointmentCount } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="mb-8">
          <h1 class="text-3xl font-serif text-navy-700">Provider Dashboard</h1>
          <p class="text-gray-500 mt-1">Manage your practice</p>
        </div>

        <!-- Verification Status Banner -->
        @if (profile) {
          @if (profile.verificationStatus === 'PENDING') {
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span class="text-amber-500 text-xl">⏳</span>
              <div>
                <p class="font-semibold text-amber-800">Verification Pending</p>
                <p class="text-amber-700 text-sm">Your profile is under review. You'll be notified once approved.</p>
              </div>
            </div>
          }
          @if (profile.verificationStatus === 'APPROVED') {
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span class="text-emerald-500 text-xl">✅</span>
              <div>
                <p class="font-semibold text-emerald-800">Verified Provider</p>
                <p class="text-emerald-700 text-sm">Your profile is active. Patients can book appointments with you.</p>
              </div>
            </div>
          }
          @if (profile.verificationStatus === 'REJECTED') {
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span class="text-red-500 text-xl">❌</span>
              <div>
                <p class="font-semibold text-red-800">Verification Rejected</p>
                @if (profile.rejectionReason) {
                  <p class="text-red-700 text-sm">Reason: {{ profile.rejectionReason }}</p>
                }
                <p class="text-red-600 text-sm mt-1">Please update your profile and contact support.</p>
              </div>
            </div>
          }
        }

        <!-- No profile yet -->
        @if (!profileLoading && !profile) {
          <div class="card text-center py-12 mb-6">
            <div class="text-5xl mb-4">👨‍⚕️</div>
            <h2 class="text-xl font-serif text-navy-700 mb-2">Complete Your Profile</h2>
            <p class="text-gray-500 mb-6">Set up your provider profile to start accepting appointments.</p>
            <a routerLink="/provider/profile-setup" class="btn-primary">Set Up Profile</a>
          </div>
        }

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card">
            <div class="text-2xl mb-1">📅</div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.scheduled || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Scheduled</p>
          </div>
          <div class="card">
            <div class="text-2xl mb-1">✅</div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.completed || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Completed</p>
          </div>
          <div class="card">
            <div class="text-2xl mb-1">❌</div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.cancelled || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Cancelled</p>
          </div>
          <div class="card">
            <div class="text-2xl mb-1">📊</div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.total || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Total</p>
          </div>
        </div>

        <!-- Today's schedule -->
        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-xl font-serif text-navy-700">Today's Schedule</h2>
            <a routerLink="/provider/appointments" class="text-sm text-emerald-600 hover:underline">View all</a>
          </div>
          @if (todayLoading) {
            <div class="space-y-3">
              @for (i of [1,2]; track i) {
                <div class="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
              }
            </div>
          }
          @if (!todayLoading && today.length === 0) {
            <div class="text-center py-8 text-gray-400">
              <p>No appointments today.</p>
            </div>
          }
          @if (!todayLoading) {
            <div class="divide-y divide-gray-100">
              @for (appt of today; track appt.appointmentId) {
                <div class="py-4 flex items-center justify-between">
                  <div>
                    <p class="font-medium text-gray-900">{{ appt.serviceType }}</p>
                    <p class="text-sm text-gray-500">{{ appt.startTime | formatTime }} – {{ appt.endTime | formatTime }}</p>
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
export class ProviderDashboardComponent implements OnInit {
  private auth = inject(AuthService);
  private providerService = inject(ProviderService);
  private apptService = inject(AppointmentService);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/provider/dashboard' },
    { label: 'Appointments', icon: '📅', route: '/provider/appointments' },
    { label: 'Slot Management', icon: '🗓️', route: '/provider/slots' },
    { label: 'My Profile', icon: '👤', route: '/provider/profile' },
  ];

  profile: ProviderResponse | null = null;
  profileLoading = true;
  today: AppointmentSummary[] = [];
  todayLoading = true;
  counts: AppointmentCount | null = null;

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerService.getMyProfile(userId).subscribe({
      next: (p) => {
        this.profile = p;
        this.profileLoading = false;
        this.loadAppointments(p.providerId);
      },
      error: () => { this.profileLoading = false; this.todayLoading = false; }
    });
  }

  loadAppointments(providerId: string): void {
    this.apptService.getProviderToday(providerId).subscribe({
      next: (a) => { this.today = a; this.todayLoading = false; },
      error: () => { this.todayLoading = false; }
    });
    this.apptService.getProviderCount(providerId).subscribe({
      next: (c) => this.counts = c
    });
  }
}
