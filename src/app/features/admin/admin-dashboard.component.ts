import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { catchError, of } from 'rxjs';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { NavigationService } from '../../core/services/navigation.service';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ProviderResponse, SpecializationCount, AppointmentSummary } from '../../core/models';
import { MonthlyRevenue, PlatformRevenue } from '../../core/payment.models';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent, IconComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="mb-8">
          <h1 class="text-3xl font-serif text-navy-700">Admin Dashboard</h1>
          <p class="text-gray-500 mt-1">Platform overview</p>
        </div>

        <!-- Row 1: Provider Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div class="card">
            <div class="mb-2"><app-icon name="users" sizeClass="w-6 h-6 text-navy-600"></app-icon></div>
            <p class="text-2xl font-bold text-navy-700">{{ totalProviders }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Total Providers</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="clock" sizeClass="w-6 h-6 text-amber-500"></app-icon></div>
            <p class="text-2xl font-bold text-amber-600">{{ pendingProviders.length }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Pending Approval</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="check-circle" sizeClass="w-6 h-6 text-emerald-600"></app-icon></div>
            <p class="text-2xl font-bold text-emerald-600">{{ approvedCount }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Approved Providers</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="user" sizeClass="w-6 h-6 text-blue-600"></app-icon></div>
            <p class="text-2xl font-bold text-navy-700">{{ totalPatients }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Registered Patients</p>
          </div>
        </div>

        <!-- Row 2: Platform Metrics -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card">
            <div class="mb-2"><app-icon name="dollar-sign" sizeClass="w-6 h-6 text-emerald-600"></app-icon></div>
            @if (revenueLoading) {
              <div class="h-8 w-20 bg-gray-100 rounded animate-pulse mb-1"></div>
            } @else {
              <p class="text-2xl font-bold text-navy-700">{{ totalRevenue | currency:'INR':'symbol':'1.0-0' }}</p>
            }
            <p class="text-gray-500 text-xs mt-0.5">Total Revenue</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="calendar" sizeClass="w-6 h-6 text-navy-600"></app-icon></div>
            @if (apptLoading) {
              <div class="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1"></div>
            } @else {
              <p class="text-2xl font-bold text-navy-700">{{ totalAppointments }}</p>
            }
            <p class="text-gray-500 text-xs mt-0.5">Total Appointments</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="check-circle" sizeClass="w-6 h-6 text-emerald-500"></app-icon></div>
            @if (apptLoading) {
              <div class="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1"></div>
            } @else {
              <p class="text-2xl font-bold text-navy-700">{{ completedAppointments }}</p>
            }
            <p class="text-gray-500 text-xs mt-0.5">Completed</p>
          </div>
          <div class="card">
            <div class="mb-2"><app-icon name="activity" sizeClass="w-6 h-6 text-purple-600"></app-icon></div>
            @if (apptLoading) {
              <div class="h-8 w-16 bg-gray-100 rounded animate-pulse mb-1"></div>
            } @else {
              <p class="text-2xl font-bold text-navy-700">{{ completionRate }}%</p>
            }
            <p class="text-gray-500 text-xs mt-0.5">Completion Rate</p>
          </div>
        </div>

        <!-- Revenue Chart + Appointment Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          <!-- Monthly Revenue Chart -->
          <div class="card">
            <div class="flex items-center justify-between mb-5">
              <h2 class="text-xl font-serif text-navy-700">Monthly Revenue</h2>
              <a routerLink="/admin/payments" class="text-sm text-emerald-600 hover:underline">View payments</a>
            </div>
            @if (revenueLoading) {
              <div class="flex items-end gap-2" style="height:160px">
                @for (i of [1,2,3,4,5,6]; track i) {
                  <div class="flex-1 bg-gray-100 rounded-t animate-pulse" [style.height.px]="40 + i * 16"></div>
                }
              </div>
            } @else if (monthlyRevenue.length === 0) {
              <div class="flex items-center justify-center text-gray-400 text-sm" style="height:160px">No revenue data yet.</div>
            } @else {
              <div class="flex items-end gap-1.5 mt-2" style="height:160px">
                @for (m of monthlyRevenue; track m.month) {
                  <div class="flex-1 flex flex-col items-center gap-1 group" style="height:100%">
                    <!-- spacer pushes bar to bottom -->
                    <div class="flex-1"></div>
                    <!-- bar — pixel height so it always renders -->
                    <div
                      class="w-full rounded-t relative overflow-visible transition-all duration-700 cursor-default"
                      [style.height.px]="maxMonthlyRevenue ? Math.max(4, (m.revenue / maxMonthlyRevenue) * 148) : 4">
                      <!-- Tooltip -->
                      <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-navy-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                        ₹{{ m.revenue | number }}
                      </div>
                      <div class="absolute inset-0 bg-gradient-to-t from-navy-600 to-navy-400 rounded-t opacity-90 group-hover:from-navy-700 group-hover:to-navy-500 transition-all duration-200"></div>
                    </div>
                    <span class="text-[10px] text-gray-400 truncate w-full text-center leading-none pb-0.5">{{ m.monthName.slice(0, 3) }}</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Appointment Breakdown -->
          <div class="card">
            <h2 class="text-xl font-serif text-navy-700 mb-5">Appointment Breakdown</h2>
            @if (apptLoading) {
              <div class="space-y-3">
                @for (i of [1,2,3,4]; track i) { <div class="h-8 bg-gray-100 rounded animate-pulse"></div> }
              </div>
            } @else {
              <div class="space-y-3">
                @for (seg of apptBreakdown; track seg.label) {
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full inline-block" [class]="seg.dot"></span>
                        <span class="text-gray-700">{{ seg.label }}</span>
                      </span>
                      <span class="text-gray-500 font-medium">{{ seg.count }} <span class="text-gray-400 font-normal">({{ totalAppointments ? ((seg.count / totalAppointments) * 100 | number:'1.0-0') : 0 }}%)</span></span>
                    </div>
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full rounded-full transition-all duration-700"
                        [class]="seg.bar"
                        [style.width.%]="totalAppointments ? (seg.count / totalAppointments) * 100 : 0">
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Pending queue + Specializations -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Pending queue -->
          <div class="card">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-serif text-navy-700">Pending Approvals</h2>
              <a routerLink="/admin/pending" class="text-sm text-emerald-600 hover:underline">View all</a>
            </div>
            @if (pendingLoading) {
              <div class="space-y-2">
                @for (i of [1,2,3]; track i) { <div class="h-12 bg-gray-100 rounded-lg animate-pulse"></div> }
              </div>
            }
            @if (!pendingLoading && pendingProviders.length === 0) {
              <div class="text-center py-8 text-gray-400">
                <div class="text-3xl mb-2">🎉</div>
                <p>No pending approvals!</p>
              </div>
            }
            @if (!pendingLoading) {
              <div class="divide-y divide-gray-100">
                @for (p of pendingProviders.slice(0, 5); track p.providerId) {
                  <div class="py-3 flex items-center justify-between">
                    <div>
                      <p class="font-medium text-gray-900 text-sm">{{ p.specialization }}</p>
                      <p class="text-xs text-gray-400">{{ p.qualification }} · {{ p.experienceYears }}yrs</p>
                    </div>
                    <a [routerLink]="['/admin/providers', p.providerId]" class="text-xs text-navy-700 hover:underline">Review →</a>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Specialization chart -->
          <div class="card">
            <h2 class="text-xl font-serif text-navy-700 mb-4">Specializations</h2>
            @if (specLoading) {
              <div class="space-y-2">
                @for (i of [1,2,3,4]; track i) { <div class="h-8 bg-gray-100 rounded animate-pulse"></div> }
              </div>
            }
            @if (!specLoading) {
              <div class="space-y-3">
                @for (spec of specializations.slice(0, 8); track spec.specialization) {
                  <div>
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-700">{{ spec.specialization }}</span>
                      <span class="text-gray-500 font-medium">{{ spec.count }}</span>
                    </div>
                    <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div class="h-full bg-navy-600 rounded-full transition-all duration-700"
                        [style.width.%]="maxSpecCount ? (spec.count / maxSpecCount) * 100 : 0">
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

      </div>
    </app-sidebar-layout>
  `
})
export class AdminDashboardComponent implements OnInit {
  readonly Math = Math;
  private providerService = inject(ProviderService);
  private navigationService = inject(NavigationService);
  private appointmentService = inject(AppointmentService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  // Provider
  pendingProviders: ProviderResponse[] = [];
  pendingLoading = true;
  totalProviders = 0;
  approvedCount = 0;
  specializations: SpecializationCount[] = [];
  specLoading = true;

  // Users
  totalPatients = 0;

  // Revenue
  totalRevenue = 0;
  monthlyRevenue: MonthlyRevenue[] = [];
  revenueLoading = true;

  // Appointments
  totalAppointments = 0;
  completedAppointments = 0;
  cancelledAppointments = 0;
  scheduledAppointments = 0;
  noShowAppointments = 0;
  apptLoading = true;

  get completionRate(): number {
    if (!this.totalAppointments) return 0;
    return Math.round((this.completedAppointments / this.totalAppointments) * 100);
  }

  get maxSpecCount(): number {
    return Math.max(...this.specializations.map(s => s.count), 1);
  }

  get maxMonthlyRevenue(): number {
    return Math.max(...this.monthlyRevenue.map(m => m.revenue), 1);
  }

  get apptBreakdown(): { label: string; count: number; dot: string; bar: string }[] {
    return [
      { label: 'Scheduled',  count: this.scheduledAppointments,  dot: 'bg-blue-500',    bar: 'bg-blue-400' },
      { label: 'Completed',  count: this.completedAppointments,  dot: 'bg-emerald-500', bar: 'bg-emerald-400' },
      { label: 'Cancelled',  count: this.cancelledAppointments,  dot: 'bg-red-400',     bar: 'bg-red-400' },
      { label: 'No-Show',    count: this.noShowAppointments,     dot: 'bg-amber-400',   bar: 'bg-amber-400' },
    ];
  }

  ngOnInit(): void {
    // Providers
    this.providerService.adminGetPending().pipe(catchError(() => of([]))).subscribe(p => {
      this.pendingProviders = p;
      this.pendingLoading = false;
    });

    this.providerService.adminGetAll().pipe(catchError(() => of([]))).subscribe(all => {
      this.totalProviders = all.length;
      this.approvedCount = all.filter(p => p.verificationStatus === 'APPROVED').length;
    });

    this.providerService.getSpecializationAnalytics().pipe(catchError(() => of([]))).subscribe(s => {
      this.specializations = s.sort((a, b) => b.count - a.count);
      this.specLoading = false;
    });

    // Patients
    this.authService.getAdminUsers('PATIENT').pipe(catchError(() => of([]))).subscribe(users => {
      this.totalPatients = users.length;
    });

    // Revenue
    this.paymentService.getPlatformRevenue().pipe(catchError(() => of(null))).subscribe(rev => {
      if (rev) {
        this.totalRevenue = rev.totalRevenue;
        this.monthlyRevenue = (rev.monthlyBreakdown ?? []).slice(-6);
      }
      this.revenueLoading = false;
    });

    // Appointments
    this.appointmentService.getAll().pipe(catchError(() => of([]))).subscribe(appts => {
      this.totalAppointments    = appts.length;
      this.completedAppointments = appts.filter(a => a.status === 'COMPLETED').length;
      this.cancelledAppointments = appts.filter(a => a.status === 'CANCELLED').length;
      this.scheduledAppointments = appts.filter(a => a.status === 'SCHEDULED').length;
      this.noShowAppointments    = appts.filter(a => a.status === 'NO_SHOW').length;
      this.apptLoading = false;
    });
  }
}