import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="max-w-2xl page-enter">
        <h1 class="text-3xl font-serif text-navy-700 mb-8">My Profile</h1>

        <div class="card mb-6">
          <!-- Profile picture preview -->
          <div class="flex items-center gap-5 mb-6 pb-6 border-b border-gray-100">
            <div class="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 border-2 border-gray-200">
              @if (profilePicUrl) {
                <img [src]="profilePicUrl" class="w-full h-full object-cover" alt="Profile">
              } @else {
                <span class="text-2xl font-bold text-gray-400">{{ initials }}</span>
              }
            </div>
            <div>
              <p class="font-semibold text-gray-800 text-lg">{{ auth.currentUser()?.fullName }}</p>
              <p class="text-sm text-gray-500 capitalize">{{ auth.currentUser()?.role?.toLowerCase() }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ auth.currentUser()?.email }}</p>
            </div>
          </div>

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
              <p class="text-xs text-gray-400 mt-1">Paste any image URL, including GIFs.</p>
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
export class AdminProfileComponent implements OnInit {
  auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  fullName = '';
  phone = '';
  profilePicUrl = '';
  saving = false;
  currentPwd = '';
  newPwd = '';
  changingPwd = false;

  get initials(): string {
    const name = this.auth.currentUser()?.fullName || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    const u = this.auth.currentUser();
    this.fullName = u?.fullName || '';
    this.phone = u?.phone || '';
    this.profilePicUrl = u?.profilePicUrl || '';

    // Fetch fresh profile from server in case it was updated outside the app
    if (u) {
      this.auth.getProfile(u.userId).subscribe({
        next: (profile) => {
          this.fullName = profile.fullName || this.fullName;
          this.phone = profile.phone || this.phone;
          this.profilePicUrl = profile.profilePicUrl || this.profilePicUrl;
        },
        error: () => {}
      });
    }
  }

  saveProfile(): void {
    this.saving = true;
    const userId = this.auth.currentUser()!.userId;
    this.auth.updateProfile(userId, {
      fullName: this.fullName,
      phone: this.phone || undefined,
      profilePicUrl: this.profilePicUrl || undefined,
    }).subscribe({
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