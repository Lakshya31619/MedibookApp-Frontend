import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProviderResponse, SpecializationCount } from '../../core/models';
import { StatusBadgePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarLayoutComponent, StatusBadgePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="mb-8">
          <h1 class="text-3xl font-serif text-navy-700">Admin Dashboard</h1>
          <p class="text-gray-500 mt-1">Platform overview</p>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div class="card">
            <div class="text-2xl mb-1">👨‍⚕️</div>
            <p class="text-2xl font-bold text-navy-700">{{ totalProviders }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Total Providers</p>
          </div>
          <div class="card">
            <div class="text-2xl mb-1">⏳</div>
            <p class="text-2xl font-bold text-amber-600">{{ pendingProviders.length }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Pending Approval</p>
          </div>
          <div class="card">
            <div class="text-2xl mb-1">✅</div>
            <p class="text-2xl font-bold text-emerald-600">{{ approvedCount }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Approved</p>
          </div>
          <div class="card">
            <div class="text-2xl mb-1">📊</div>
            <p class="text-2xl font-bold text-navy-700">{{ specializations.length }}</p>
            <p class="text-gray-500 text-xs mt-0.5">Specializations</p>
          </div>
        </div>

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
  private providerService = inject(ProviderService);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/admin/dashboard' },
    { label: 'Pending Approvals', icon: '⏳', route: '/admin/pending' },
    { label: 'All Providers', icon: '👨‍⚕️', route: '/admin/providers' },
  ];

  pendingProviders: ProviderResponse[] = [];
  pendingLoading = true;
  totalProviders = 0;
  approvedCount = 0;
  specializations: SpecializationCount[] = [];
  specLoading = true;

  get maxSpecCount(): number {
    return Math.max(...this.specializations.map(s => s.count), 1);
  }

  ngOnInit(): void {
    this.providerService.adminGetPending().subscribe({
      next: (p) => { this.pendingProviders = p; this.pendingLoading = false; },
      error: () => { this.pendingLoading = false; }
    });

    this.providerService.adminGetAll().subscribe({
      next: (all) => {
        this.totalProviders = all.length;
        this.approvedCount = all.filter(p => p.verificationStatus === 'APPROVED').length;
      }
    });

    this.providerService.getSpecializationAnalytics().subscribe({
      next: (s) => {
        this.specializations = s.sort((a, b) => b.count - a.count);
        this.specLoading = false;
      },
      error: () => { this.specLoading = false; }
    });
  }
}
