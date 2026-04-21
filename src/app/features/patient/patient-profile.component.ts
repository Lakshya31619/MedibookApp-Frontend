import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="max-w-2xl page-enter">
        <h1 class="text-3xl font-serif text-navy-700 mb-8">My Profile</h1>

        <div class="card mb-6">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Personal Information</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" [(ngModel)]="fullName" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" [value]="auth.currentUser()?.email" class="input-field bg-gray-50" readonly>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" [(ngModel)]="phone" class="input-field" placeholder="Your phone number">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
              <input type="url" [(ngModel)]="profilePicUrl" class="input-field" placeholder="https://…">
            </div>
          </div>
          <button (click)="saveProfile()" [disabled]="saving" class="btn-primary mt-5">
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

        <div class="card">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Change Password</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" [(ngModel)]="currentPwd" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" [(ngModel)]="newPwd" class="input-field">
            </div>
          </div>
          <button (click)="changePassword()" [disabled]="changingPwd" class="btn-secondary mt-5">
            {{ changingPwd ? 'Updating…' : 'Update Password' }}
          </button>
        </div>
      </div>
    </app-sidebar-layout>
  `
})
export class PatientProfileComponent implements OnInit {
  auth = inject(AuthService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/patient/dashboard' },
    { label: 'Find Doctors', icon: '🔍', route: '/patient/browse' },
    { label: 'My Appointments', icon: '📅', route: '/patient/appointments' },
    { label: 'Profile', icon: '👤', route: '/patient/profile' },
  ];

  fullName = '';
  phone = '';
  profilePicUrl = '';
  saving = false;
  currentPwd = '';
  newPwd = '';
  changingPwd = false;

  ngOnInit(): void {
    const u = this.auth.currentUser();
    this.fullName = u?.fullName || '';
    this.phone = u?.phone || '';
    this.profilePicUrl = u?.profilePicUrl || '';
  }

  saveProfile(): void {
    this.saving = true;
    const userId = this.auth.currentUser()!.userId;
    this.auth.updateProfile(userId, { fullName: this.fullName, phone: this.phone || undefined, profilePicUrl: this.profilePicUrl || undefined }).subscribe({
      next: () => { this.saving = false; this.toast.success('Profile updated!'); },
      error: () => { this.saving = false; this.toast.error('Update failed.'); }
    });
  }

  changePassword(): void {
    if (!this.currentPwd || !this.newPwd) return;
    this.changingPwd = true;
    this.auth.changePassword({ currentPassword: this.currentPwd, newPassword: this.newPwd }).subscribe({
      next: () => {
        this.changingPwd = false;
        this.toast.success('Password updated!');
        this.currentPwd = '';
        this.newPwd = '';
      },
      error: () => { this.changingPwd = false; this.toast.error('Password change failed.'); }
    });
  }
}
