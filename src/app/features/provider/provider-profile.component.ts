import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ProviderService } from '../../core/services/provider.service';
import { ToastService } from '../../core/services/toast.service';
import { ProviderResponse } from '../../core/models';
import { StatusBadgePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, StatusBadgePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="max-w-2xl page-enter">
        <h1 class="text-3xl font-serif text-navy-700 mb-8">My Provider Profile</h1>

        @if (!profile && !loading) {
          <div class="card text-center py-12">
            <p class="text-gray-500 mb-4">You haven't set up a provider profile yet.</p>
            <a routerLink="/provider/profile-setup" class="btn-primary">Set Up Profile</a>
          </div>
        }

        @if (profile) {
          <!-- Status -->
          <div class="flex items-center gap-3 mb-6">
            <span [ngClass]="profile.verificationStatus | statusBadge">{{ profile.verificationStatus }}</span>
            @if (profile.available) {
              <span class="badge-approved">Available</span>
            } @else {
              <span class="badge-cancelled">Not Available</span>
            }
            <button (click)="toggleAvailability()" class="text-sm text-navy-700 border border-navy-200 px-3 py-1 rounded-lg hover:bg-navy-50 transition-colors ml-2">
              {{ profile.available ? 'Set Unavailable' : 'Set Available' }}
            </button>
          </div>

          <div class="card mb-6">
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Professional Details</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input type="text" [(ngModel)]="form.specialization" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input type="text" [(ngModel)]="form.qualification" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
                <input type="number" [(ngModel)]="form.experienceYears" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                <input type="number" [(ngModel)]="form.consultationFee" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input type="text" [(ngModel)]="form.clinicName" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Clinic Address</label>
                <input type="text" [(ngModel)]="form.clinicAddress" class="input-field">
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea [(ngModel)]="form.bio" rows="3" class="input-field resize-none"></textarea>
            </div>
            <div class="mb-5">
              <label class="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
              <input type="url" [(ngModel)]="form.profilePicUrl" class="input-field">
            </div>
            <button (click)="saveProfile()" [disabled]="saving" class="btn-primary">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>

          <div class="card">
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Change Password</h2>
            <div class="space-y-4 mb-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input type="password" [(ngModel)]="currentPwd" class="input-field">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input type="password" [(ngModel)]="newPwd" class="input-field">
              </div>
            </div>
            <button (click)="changePassword()" [disabled]="changingPwd" class="btn-secondary">
              {{ changingPwd ? 'Updating…' : 'Update Password' }}
            </button>
          </div>
        }
      </div>
    </app-sidebar-layout>
  `
})
export class ProviderProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  profile: ProviderResponse | null = null;
  loading = true;
  saving = false;
  form: any = {};
  currentPwd = ''; newPwd = ''; changingPwd = false;

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerService.getMyProfile(userId).subscribe({
      next: (p) => {
        this.profile = p;
        this.form = {
          specialization: p.specialization, qualification: p.qualification,
          experienceYears: p.experienceYears, consultationFee: p.consultationFee,
          clinicName: p.clinicName, clinicAddress: p.clinicAddress,
          bio: p.bio, profilePicUrl: p.profilePicUrl,
        };
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.providerService.update(this.profile!.providerId, this.form).subscribe({
      next: (p) => { this.saving = false; this.profile = p; this.toast.success('Profile updated!'); },
      error: () => { this.saving = false; this.toast.error('Update failed.'); }
    });
  }

  toggleAvailability(): void {
    const next = !this.profile!.available;
    this.providerService.setAvailability(this.profile!.providerId, next).subscribe({
      next: (p) => { this.profile = p; this.toast.success(`Availability set to ${next ? 'Available' : 'Unavailable'}`); },
      error: () => this.toast.error('Failed.')
    });
  }

  changePassword(): void {
    if (!this.currentPwd || !this.newPwd) return;
    this.changingPwd = true;
    this.auth.changePassword({ currentPassword: this.currentPwd, newPassword: this.newPwd }).subscribe({
      next: () => {
        this.changingPwd = false;
        this.toast.success('Password updated!');
        this.currentPwd = ''; this.newPwd = '';
      },
      error: () => { this.changingPwd = false; this.toast.error('Failed.'); }
    });
  }
}