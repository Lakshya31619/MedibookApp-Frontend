import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { NavigationService } from '../../core/services/navigation.service';
import { ProviderService } from '../../core/services/provider.service';
import { ToastService } from '../../core/services/toast.service';
import { ProviderResponse } from '../../core/models';
import { StatusBadgePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-admin-provider-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, ConfirmModalComponent, StatusBadgePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <div class="mb-6">
          <a routerLink="/admin/providers" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
            ← Back to Providers
          </a>
          <h1 class="text-3xl font-serif text-navy-700">Provider Detail</h1>
        </div>

        @if (loading) {
          <div class="card animate-pulse h-64"></div>
        }

        @if (!loading && provider) {
          <!-- Status banner -->
          <div class="rounded-xl p-4 mb-6 flex items-start justify-between gap-4"
            [ngClass]="{
              'bg-amber-50 border border-amber-200': provider.verificationStatus === 'PENDING',
              'bg-emerald-50 border border-emerald-200': provider.verificationStatus === 'APPROVED',
              'bg-red-50 border border-red-200': provider.verificationStatus === 'REJECTED'
            }">
            <div class="flex items-start gap-3">
              <span class="text-2xl">
                {{ provider.verificationStatus === 'PENDING' ? '⏳' : provider.verificationStatus === 'APPROVED' ? '✅' : '❌' }}
              </span>
              <div>
                <span [ngClass]="provider.verificationStatus | statusBadge" class="mb-1">{{ provider.verificationStatus }}</span>
                @if (provider.verificationStatus === 'REJECTED' && provider.rejectionReason) {
                  <p class="text-red-700 text-sm mt-1">Reason: {{ provider.rejectionReason }}</p>
                }
              </div>
            </div>
            <!-- Actions -->
            <div class="flex gap-2 flex-wrap justify-end">
              @if (provider.verificationStatus === 'PENDING' || provider.verificationStatus === 'REJECTED') {
                <button (click)="approve()" [disabled]="acting" class="btn-emerald text-sm py-2">Approve</button>
              }
              @if (provider.verificationStatus === 'PENDING' || provider.verificationStatus === 'APPROVED') {
                <button (click)="openRejectModal()" class="btn-danger text-sm py-2">Reject</button>
              }
              @if (provider.verificationStatus === 'APPROVED') {
                <button (click)="resetToP()" [disabled]="acting" class="btn-secondary text-sm py-2">Reset to Pending</button>
              }
              <button (click)="openDeleteModal()" class="btn-danger text-sm py-2">Delete</button>
            </div>
          </div>

          <!-- Details card -->
          <div class="card mb-6">
            <div class="flex items-start gap-5 mb-6">
              <div class="w-20 h-20 bg-navy-100 rounded-2xl flex items-center justify-center text-navy-700 font-bold text-3xl overflow-hidden flex-shrink-0">
                @if (provider.profilePicUrl) {
                  <img [src]="provider.profilePicUrl" class="w-full h-full object-cover" alt="">
                } @else {
                  {{ provider.specialization[0] }}
                }
              </div>
              <div>
                <h2 class="text-xl font-serif text-navy-700 mb-1">{{ provider.specialization }}</h2>
                <p class="text-gray-600">{{ provider.qualification }}</p>
                <p class="text-gray-400 text-sm">{{ provider.experienceYears }} years experience</p>
                @if (provider.consultationFee) {
                  <p class="text-navy-700 font-semibold mt-1">₹{{ provider.consultationFee }} consultation fee</p>
                }
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
              @if (provider.clinicName) {
                <div>
                  <span class="text-gray-400">Clinic</span>
                  <p class="text-gray-900 font-medium">{{ provider.clinicName }}</p>
                </div>
              }
              @if (provider.clinicAddress) {
                <div>
                  <span class="text-gray-400">Address</span>
                  <p class="text-gray-900 font-medium">{{ provider.clinicAddress }}</p>
                </div>
              }
              @if (provider.avgRating) {
                <div>
                  <span class="text-gray-400">Rating</span>
                  <p class="text-gray-900 font-medium">★ {{ provider.avgRating.toFixed(1) }}</p>
                </div>
              }
              <div>
                <span class="text-gray-400">Registered</span>
                <p class="text-gray-900 font-medium">{{ provider.createdAt | formatDate }}</p>
              </div>
              <div>
                <span class="text-gray-400">Availability</span>
                <p class="font-medium" [ngClass]="provider.available ? 'text-emerald-600' : 'text-red-500'">
                  {{ provider.available ? 'Available' : 'Not Available' }}
                </p>
              </div>
            </div>

            @if (provider.bio) {
              <div class="border-t border-gray-100 pt-4">
                <p class="text-gray-400 text-xs mb-1">Bio</p>
                <p class="text-gray-700 text-sm leading-relaxed">{{ provider.bio }}</p>
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
      message="Provide a reason for rejection. The provider will see this message."
      confirmText="Reject"
      cancelText="Cancel"
      [danger]="true"
      [requireReason]="true"
      reasonLabel="Rejection Reason"
      (confirmed)="confirmReject($event)"
      (cancelled)="rejectModal = false">
    </app-confirm-modal>

    <!-- Delete Modal -->
    <app-confirm-modal
      [open]="deleteModal"
      title="Delete Provider"
      message="This will permanently remove the provider. This action cannot be undone."
      confirmText="Delete"
      cancelText="Cancel"
      [danger]="true"
      (confirmed)="confirmDelete()"
      (cancelled)="deleteModal = false">
    </app-confirm-modal>
  `
})
export class AdminProviderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private navigationService = inject(NavigationService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  provider: ProviderResponse | null = null;
  loading = true;
  acting = false;
  rejectModal = false;
  deleteModal = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.providerService.getById(id).subscribe({
      next: (p) => { this.provider = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  approve(): void {
    this.acting = true;
    this.providerService.approve(this.provider!.providerId).subscribe({
      next: () => {
        this.acting = false;
        this.provider = { ...this.provider!, verificationStatus: 'APPROVED', verified: true };
        this.toast.success('Provider approved!');
      },
      error: () => { this.acting = false; this.toast.error('Failed.'); }
    });
  }

  openRejectModal(): void { this.rejectModal = true; }

  confirmReject(reason: string): void {
    this.rejectModal = false;
    this.providerService.reject(this.provider!.providerId, reason).subscribe({
      next: () => {
        this.provider = { ...this.provider!, verificationStatus: 'REJECTED', verified: false, rejectionReason: reason };
        this.toast.info('Provider rejected.');
      },
      error: () => this.toast.error('Failed.')
    });
  }

  resetToP(): void {
    this.acting = true;
    this.providerService.unverify(this.provider!.providerId).subscribe({
      next: (p) => { this.acting = false; this.provider = p; this.toast.info('Reset to pending.'); },
      error: () => { this.acting = false; this.toast.error('Failed.'); }
    });
  }

  openDeleteModal(): void { this.deleteModal = true; }

  confirmDelete(): void {
    this.deleteModal = false;
    this.providerService.delete(this.provider!.providerId).subscribe({
      next: () => { this.toast.success('Provider deleted.'); this.router.navigate(['/admin/providers']); },
      error: () => this.toast.error('Delete failed.')
    });
  }
}