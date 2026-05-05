import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { IconComponent } from '../../shared/components/icon.component';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-admin-patients',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent, ConfirmModalComponent, IconComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="flex items-center justify-between mb-6">
          <h1 class="page-title">Patients</h1>
          <span class="text-gray-500 text-sm">{{ filtered.length }} of {{ patients.length }}</span>
        </div>

        <!-- Search -->
        <div class="mb-6">
          <input type="text" [(ngModel)]="search" (input)="applyFilter()"
            placeholder="Search by name or email…"
            class="input-field w-full sm:max-w-sm">
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
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Patient</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium hidden sm:table-cell">Email</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium hidden md:table-cell">Joined</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                    <th class="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                  @for (u of filtered; track u.userId) {
                    <tr class="hover:bg-gray-50 transition-colors">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center text-navy-700 text-xs font-bold overflow-hidden flex-shrink-0">
                            @if (u.profilePicUrl) {
                              <img [src]="u.profilePicUrl" class="w-full h-full object-cover" alt="">
                            } @else {
                              {{ u.fullName[0].toUpperCase() || '?' }}
                            }
                          </div>
                          <span class="font-medium text-gray-900">{{ u.fullName || '—' }}</span>
                        </div>
                      </td>
                      <td class="py-3 px-4 text-gray-500 hidden sm:table-cell">{{ u.email }}</td>
                      <td class="py-3 px-4 text-gray-400 hidden md:table-cell text-xs">{{ u.createdAt | date:'mediumDate' }}</td>
                      <td class="py-3 px-4">
                        @if (u.active) {
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>
                        } @else {
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">Deactivated</span>
                        }
                      </td>
                      <td class="py-3 px-4">
                        @if (u.active) {
                          <button (click)="openDeactivate(u)"
                            class="text-xs text-red-500 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors">
                            Deactivate
                          </button>
                        } @else {
                          <span class="text-xs text-gray-400 italic">Inactive</span>
                        }
                      </td>
                    </tr>
                  }
                  @if (filtered.length === 0) {
                    <tr>
                      <td colspan="5" class="text-center py-12 text-gray-400">No patients found.</td>
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
      [open]="deactivateModal"
      title="Deactivate Patient"
      message="This will deactivate the patient's account. They will no longer be able to log in."
      confirmText="Deactivate"
      cancelText="Cancel"
      [danger]="true"
      (confirmed)="confirmDeactivate()"
      (cancelled)="deactivateModal = false">
    </app-confirm-modal>
  `
})
export class AdminPatientsComponent implements OnInit {
  private navigationService = inject(NavigationService);
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  patients: User[] = [];
  filtered: User[] = [];
  loading = true;
  search = '';

  deactivateModal = false;
  deactivateTarget: User | null = null;

  ngOnInit(): void {
    this.authSvc.getAdminUsers('PATIENT').subscribe({
      next: (u) => { this.patients = u; this.filtered = u; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.patients.filter(u =>
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }

  openDeactivate(u: User): void {
    this.deactivateTarget = u;
    this.deactivateModal = true;
  }

  confirmDeactivate(): void {
    this.deactivateModal = false;
    const target = this.deactivateTarget!;
    this.authSvc.deactivateAccount(target.userId).subscribe({
      next: () => {
        const idx = this.patients.findIndex(u => u.userId === target.userId);
        if (idx !== -1) this.patients[idx] = { ...this.patients[idx], active: false };
        this.applyFilter();
        this.toast.success('Patient account deactivated.');
        this.deactivateTarget = null;
      },
      error: () => this.toast.error('Failed to deactivate account.')
    });
  }
}