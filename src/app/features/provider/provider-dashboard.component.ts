import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProviderResponse, AppointmentSummary, AppointmentCount } from '../../core/models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-provider-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent, StatusBadgePipe, FormatTimePipe, IconComponent],
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
              <app-icon name="clock" sizeClass="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5"></app-icon>
              <div>
                <p class="font-semibold text-amber-800">Verification Pending</p>
                <p class="text-amber-700 text-sm">Your profile is under review. You'll be notified once approved.</p>
              </div>
            </div>
          }
          @if (profile.verificationStatus === 'APPROVED') {
            <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <app-icon name="check-circle" sizeClass="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5"></app-icon>
              <div>
                <p class="font-semibold text-emerald-800">Verified Provider</p>
                <p class="text-emerald-700 text-sm">Your profile is active. Patients can book appointments with you.</p>
              </div>
            </div>
          }
          @if (profile.verificationStatus === 'REJECTED') {
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <app-icon name="x-circle" sizeClass="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"></app-icon>
              <div class="flex-1">
                <p class="font-semibold text-red-800">Verification Rejected</p>
                @if (profile.rejectionReason) {
                  <p class="text-red-700 text-sm">Reason: {{ profile.rejectionReason }}</p>
                }
                <p class="text-red-600 text-sm mt-1">Update your profile details and resubmit for admin review.</p>
                <a routerLink="/provider/profile" class="inline-block mt-3 btn-primary text-sm">Update & Resubmit</a>
              </div>
            </div>
          }
        }

        <!-- No profile yet -->
        @if (!profileLoading && !profile) {
          <div class="card text-center py-12 mb-6">
            <div class="inline-block p-4 bg-navy-50 rounded-xl mb-4">
              <app-icon name="user" sizeClass="w-10 h-10 text-navy-700"></app-icon>
            </div>
            <h2 class="text-xl font-serif text-navy-700 mb-2">Complete Your Profile</h2>
            <p class="text-gray-500 mb-6">Set up your provider profile to start accepting appointments.</p>
            <a routerLink="/provider/profile-setup" class="btn-primary">Set Up Profile</a>
          </div>
        }

        <!-- Profile Card -->
        @if (profile && !profileLoading) {
          <div class="card mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div class="w-24 h-24 rounded-2xl bg-navy-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
              @if (profile.profilePicUrl) {
                <img [src]="profile.profilePicUrl" class="w-full h-full object-cover" alt="{{ profile.specialization }}">
              } @else {
                <app-icon name="user" sizeClass="w-12 h-12 text-navy-400"></app-icon>
              }
            </div>
            <div class="flex-1">
              <h2 class="text-2xl font-serif text-navy-700 mb-1">Dr. {{ (auth.currentUser()?.fullName || 'Provider') }}</h2>
              <p class="text-lg text-navy-600 font-medium mb-2">{{ profile.specialization }}</p>
              <p class="text-gray-600 text-sm">{{ profile.qualification }} • {{ profile.experienceYears }} years experience</p>
              @if (profile.clinicName) {
                <p class="text-gray-500 text-sm mt-2 flex items-center gap-2">
                  <app-icon name="hospital" sizeClass="w-4 h-4"></app-icon>
                  {{ profile.clinicName }}
                </p>
              }
            </div>
            <a routerLink="/provider/profile" class="btn-secondary text-sm flex-shrink-0">Edit Profile</a>
          </div>
        }

        <!-- Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div class="card">
            <div class="mb-2"><app-icon name="calendar" sizeClass="w-6 h-6 text-navy-700"></app-icon></div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.scheduled || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Scheduled</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="check-circle" sizeClass="w-6 h-6 text-emerald-600"></app-icon></div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.completed || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Completed</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="x-circle" sizeClass="w-6 h-6 text-red-600"></app-icon></div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.cancelled || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Cancelled</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="user-x" sizeClass="w-6 h-6 text-amber-500"></app-icon></div>
            <p class="text-2xl font-bold text-navy-700">{{ counts?.noShow || 0 }}</p>
            <p class="text-gray-500 text-xs mt-0.5">No-Show</p>
          </div>
          <div class="card col-span-2 sm:col-span-1">
            <div class="mb-2"><app-icon name="bar-chart-2" sizeClass="w-6 h-6 text-blue-600"></app-icon></div>
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
  auth = inject(AuthService);
  private router = inject(Router);
  private navigationService = inject(NavigationService);
  private providerService = inject(ProviderService);
  private apptService = inject(AppointmentService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  oldNavItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'home', route: '/provider/dashboard' },
    { label: 'Appointments', iconName: 'calendar', route: '/provider/appointments' },
    { label: 'Slot Management', iconName: 'grid', route: '/provider/slots' },
    { label: 'Records',       iconName: 'file-text',    route: '/provider/records' },
    { label: 'Earnings',       iconName: 'trending-up', route: '/provider/earnings' },
    { label: 'My Profile', iconName: 'user', route: '/provider/profile' },
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
      error: (err) => {
        this.profileLoading = false;
        this.todayLoading = false;
        if (err.status === 404) {
          this.router.navigate(['/provider/profile-setup']);
        }
      }
    });
  }

  loadAppointments(providerId: number): void {
    this.apptService.getProviderToday(providerId).subscribe({
      next: (a) => { this.today = a; this.todayLoading = false; },
      error: () => { this.todayLoading = false; }
    });
    this.apptService.getProviderCount(providerId).subscribe({
      next: (c) => this.counts = c
    });
  }
}