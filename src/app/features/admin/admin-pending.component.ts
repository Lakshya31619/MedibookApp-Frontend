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
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-admin-pending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, ConfirmModalComponent, StatusBadgePipe, IconComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-3xl font-serif text-navy-700">Pending Approvals</h1>
            <p class="text-gray-500 mt-1">{{ providers.length }} provider(s) awaiting review</p>
          </div>
        </div>

        @if (loading) {
          <div class="space-y-4">
            @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-36"></div> }
          </div>
        }

        @if (!loading && providers.length === 0) {
          <div class="card text-center py-16">
            <div class="inline-block p-3 bg-emerald-50 rounded-xl mb-4">
              <app-icon name="check-circle" sizeClass="w-12 h-12 text-emerald-600"></app-icon>
            </div>
            <h2 class="text-xl font-serif text-navy-700 mb-2">All caught up!</h2>
            <p class="text-gray-500">No providers pending approval.</p>
          </div>
        }

        @if (!loading) {
          <div class="space-y-4">
            @for (p of providers; track p.providerId) {
              <div class="card">
                <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-navy-100 rounded-xl flex items-center justify-center text-navy-700 font-bold text-lg flex-shrink-0 overflow-hidden">
                      @if (p.profilePicUrl) {
                        <img [src]="p.profilePicUrl" class="w-full h-full object-cover" alt="">
                      } @else {
                        {{ p.specialization[0] }}
                      }
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-1">
                        <span [ngClass]="p.verificationStatus | statusBadge">{{ p.verificationStatus }}</span>
                      </div>
                      <p class="font-semibold text-gray-900">{{ p.specialization }}</p>
                      <p class="text-sm text-gray-500">{{ p.qualification }} · {{ p.experienceYears }} years experience</p>
                      @if (p.clinicName) { 
                        <p class="text-xs text-gray-400 mt-0.5">
                          <app-icon name="hospital" sizeClass="w-3.5 h-3.5 inline mr-1 align-text-bottom"></app-icon>
                          {{ p.clinicName }}, {{ p.clinicAddress }}
                        </p> 
                      }
                      @if (p.bio) { <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ p.bio }}</p> }
                    </div>
                  </div>

                  <div class="flex gap-2 flex-shrink-0">
                    <button (click)="approve(p)" [disabled]="actionId === p.providerId"
                      class="btn-emerald text-sm py-2 flex items-center gap-1">
                      <app-icon name="check" sizeClass="w-4 h-4"></app-icon>
                      {{ actionId === p.providerId ? 'Approving…' : 'Approve' }}
                    </button>
                    <button (click)="openReject(p)"
                      class="btn-danger text-sm py-2 flex items-center gap-1">
                      <app-icon name="x" sizeClass="w-4 h-4"></app-icon>
                      Reject
                    </button>
                    <a [routerLink]="['/admin/providers', p.providerId]" class="btn-secondary text-sm py-2">
                      Details
                    </a>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-sidebar-layout>

    <!-- Reject Modal -->
    <app-confirm-modal
      [open]="rejectModal"
      title="Reject Provider"
      message="Please provide a reason for rejection. The provider will be notified."
      confirmText="Reject"
      cancelText="Cancel"
      [danger]="true"
      [requireReason]="true"
      reasonLabel="Rejection Reason"
      reasonPlaceholder="e.g. Insufficient qualification details, incomplete profile…"
      (confirmed)="confirmReject($event)"
      (cancelled)="rejectModal = false">
    </app-confirm-modal>
  `
})
export class AdminPendingComponent implements OnInit {
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'home', route: '/admin/dashboard' },
    { label: 'Pending Approvals', iconName: 'clock', route: '/admin/pending' },
    { label: 'All Providers', iconName: 'users', route: '/admin/providers' },
    { label: 'Payments', iconName: 'dollar-sign', route: '/admin/payments' },
  ];

  providers: ProviderResponse[] = [];
  loading = true;
  actionId = '';
  rejectModal = false;
  rejectTarget: ProviderResponse | null = null;

  ngOnInit(): void {
    this.providerService.adminGetPending().subscribe({
      next: (p) => { this.providers = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  approve(p: ProviderResponse): void {
    this.actionId = p.providerId;
    this.providerService.approve(p.providerId).subscribe({
      next: () => {
        this.actionId = '';
        this.providers = this.providers.filter(x => x.providerId !== p.providerId);
        this.toast.success('Provider approved!');
      },
      error: () => { this.actionId = ''; this.toast.error('Approval failed.'); }
    });
  }

  openReject(p: ProviderResponse): void {
    this.rejectTarget = p;
    this.rejectModal = true;
  }

  confirmReject(reason: string): void {
    this.rejectModal = false;
    if (!this.rejectTarget) return;
    this.providerService.reject(this.rejectTarget.providerId, reason).subscribe({
      next: () => {
        this.providers = this.providers.filter(x => x.providerId !== this.rejectTarget!.providerId);
        this.toast.info('Provider rejected.');
        this.rejectTarget = null;
      },
      error: () => this.toast.error('Rejection failed.')
    });
  }
}
