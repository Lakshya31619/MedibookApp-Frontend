import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { ProviderService } from '../../core/services/provider.service';
import { ToastService } from '../../core/services/toast.service';
import { ProviderResponse } from '../../core/models';
import { StatusBadgePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, ConfirmModalComponent, StatusBadgePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="flex items-center justify-between mb-6">
          <h1 class="text-3xl font-serif text-navy-700">All Providers</h1>
          <span class="text-gray-500 text-sm">{{ filtered.length }} of {{ providers.length }}</span>
        </div>

        <!-- Search + filter -->
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <input type="text" [(ngModel)]="search" (input)="applyFilter()" placeholder="Search by specialization or clinic…"
            class="input-field flex-1">
          <select [(ngModel)]="statusFilter" (change)="applyFilter()" class="input-field sm:w-48">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3,4,5]; track i) { <div class="card animate-pulse h-16"></div> }
          </div>
        }

        @if (!loading) {
          <div class="card overflow-hidden p-0">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Provider</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Specialization</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">Clinic</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (p of filtered; track p.providerId) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 text-xs font-bold overflow-hidden flex-shrink-0">
                            @if (p.profilePicUrl) {
                              <img [src]="p.profilePicUrl" class="w-full h-full object-cover" alt="">
                            } @else {
                              {{ p.specialization[0] }}
                            }
                          </div>
                          <span class="font-medium text-gray-900">{{ p.qualification }}</span>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-gray-600">{{ p.specialization }}</td>
                      <td class="py-3 px-4 text-gray-500 hidden md:table-cell">{{ p.clinicName || '–' }}</td>
                      <td class="py-3 px-4">
                        <span [ngClass]="p.verificationStatus | statusBadge">{{ p.verificationStatus }}</span>
                      </td>
                      <td class="py-3 px-4">
                        <div class="flex gap-2">
                          <a [routerLink]="['/admin/providers', p.providerId]"
                            class="text-xs text-navy-700 border border-navy-200 px-2.5 py-1 rounded-lg hover:bg-navy-50 transition-colors">
                            View
                          </a>
                          @if (p.verificationStatus === 'PENDING') {
                            <button (click)="quickApprove(p)" class="text-xs text-emerald-600 border border-emerald-200 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors">
                              Approve
                            </button>
                          }
                          <button (click)="openDelete(p)" class="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @if (filtered.length === 0) {
                    <tr>
                      <td colspan="5" class="text-center py-12 text-gray-400">No providers found.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </app-sidebar-layout>

    <app-confirm-modal
      [open]="deleteModal"
      title="Delete Provider"
      message="Are you sure you want to permanently delete this provider? This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      [danger]="true"
      (confirmed)="confirmDelete()"
      (cancelled)="deleteModal = false">
    </app-confirm-modal>
  `
})
export class AdminProvidersComponent implements OnInit {
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'home', route: '/admin/dashboard' },
    { label: 'Pending Approvals', iconName: 'clock', route: '/admin/pending' },
    { label: 'All Providers', iconName: 'users', route: '/admin/providers' },
    { label: 'Reviews', iconName: 'star', route: '/admin/reviews' },
    { label: 'Payments', iconName: 'dollar-sign', route: '/admin/payments' },
    { label: 'My Profile', iconName: 'user', route: '/admin/profile' },
  ];

  providers: ProviderResponse[] = [];
  filtered: ProviderResponse[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  deleteModal = false;
  deleteTarget: ProviderResponse | null = null;

  ngOnInit(): void {
    this.providerService.adminGetAll().subscribe({
      next: (p) => { this.providers = p; this.filtered = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    this.filtered = this.providers.filter(p => {
      const matchSearch = !this.search || p.specialization.toLowerCase().includes(this.search.toLowerCase()) || (p.clinicName || '').toLowerCase().includes(this.search.toLowerCase());
      const matchStatus = !this.statusFilter || p.verificationStatus === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  quickApprove(p: ProviderResponse): void {
    this.providerService.approve(p.providerId).subscribe({
      next: () => {
        const idx = this.providers.findIndex(x => x.providerId === p.providerId);
        if (idx !== -1) this.providers[idx] = { ...this.providers[idx], verificationStatus: 'APPROVED', verified: true };
        this.applyFilter();
        this.toast.success('Provider approved!');
      },
      error: () => this.toast.error('Approval failed.')
    });
  }

  openDelete(p: ProviderResponse): void {
    this.deleteTarget = p;
    this.deleteModal = true;
  }

  confirmDelete(): void {
    this.deleteModal = false;
    if (!this.deleteTarget) return;
    this.providerService.delete(this.deleteTarget.providerId).subscribe({
      next: () => {
        this.providers = this.providers.filter(x => x.providerId !== this.deleteTarget!.providerId);
        this.applyFilter();
        this.toast.success('Provider deleted.');
        this.deleteTarget = null;
      },
      error: () => this.toast.error('Delete failed.')
    });
  }
}