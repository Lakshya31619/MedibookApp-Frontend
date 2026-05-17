import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { NavigationService } from '../../core/services/navigation.service';
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
              <input type="text" [ngModel]="fullName()" (ngModelChange)="fullName.set($event)" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" [value]="auth.currentUser()?.email" class="input-field bg-gray-50" readonly>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" [ngModel]="phone()" (ngModelChange)="phone.set($event)" class="input-field" placeholder="Your phone number">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
              <input type="url" [ngModel]="profilePicUrl()" (ngModelChange)="profilePicUrl.set($event)" class="input-field" placeholder="https://…">
            </div>
          </div>
          <button (click)="saveProfile()" [disabled]="saving()" class="btn-primary mt-5">
            {{ saving() ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

        <div class="card">
          <h2 class="text-lg font-semibold text-gray-700 mb-4">Change Password</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <input type="password" [ngModel]="currentPwd()" (ngModelChange)="currentPwd.set($event)" class="input-field">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input type="password" [ngModel]="newPwd()" (ngModelChange)="newPwd.set($event)" class="input-field">
            </div>
          </div>
          <button (click)="changePassword()" [disabled]="changingPwd()" class="btn-secondary mt-5">
            {{ changingPwd() ? 'Updating…' : 'Update Password' }}
          </button>
        </div>
      </div>
    </app-sidebar-layout>
  `
})
export class PatientProfileComponent implements OnInit {
  auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];

  // Reactive form fields - synced with auth service
  fullName = signal('');
  phone = signal('');
  profilePicUrl = signal('');
  saving = signal(false);
  currentPwd = signal('');
  newPwd = signal('');
  changingPwd = signal(false);

  constructor() {
    this.navItems = this.navigationService.getNavItems();
    
    // Watch for changes in auth service and sync form fields
    // This effect runs whenever auth.currentUser() changes
    effect(() => {
      const u = this.auth.currentUser();
      console.log('effect() triggered, current user:', u);
      if (u) {
        console.log('Updating form signals with fullName:', u.fullName, 'phone:', u.phone);
        this.fullName.set(u.fullName || '');
        this.phone.set(u.phone || '');
        this.profilePicUrl.set(u.profilePicUrl || '');
      }
    });
  }

  ngOnInit(): void {
    // Fetch fresh profile from backend to ensure we have all data
    // (including fullName which might be missing from login response)
    const userId = this.auth.currentUser()?.userId;
    if (userId) {
      this.auth.getProfile(userId).subscribe({
        next: (freshProfile) => {
          console.log('Fresh profile loaded:', freshProfile);
          this.auth.setUserProfile(freshProfile);
          this.fullName.set(freshProfile.fullName || '');
          this.phone.set(freshProfile.phone || '');
          this.profilePicUrl.set(freshProfile.profilePicUrl || '');
        },
        error: (err) => {
          console.error('Failed to load profile:', err);
          // Fallback to cached user
          const u = this.auth.currentUser();
          if (u) {
            this.fullName.set(u.fullName || '');
            this.phone.set(u.phone || '');
            this.profilePicUrl.set(u.profilePicUrl || '');
          }
        }
      });
    }
  }

  saveProfile(): void {
    this.saving.set(true);
    const userId = this.auth.currentUser()!.userId;
    this.auth.updateProfile(userId, {
      fullName: this.fullName(),
      phone: this.phone(),
      profilePicUrl: this.profilePicUrl(),
    }).subscribe({
      next: (res) => {
        console.log('Profile updated, response:', res);
        
        // Immediately fetch fresh profile to ensure we have latest data
        this.auth.getProfile(userId).subscribe({
          next: (freshProfile) => {
            console.log('Fresh profile fetched:', freshProfile);
            this.auth.setUserProfile(freshProfile);
            this.saving.set(false);
            this.toast.success('Profile updated!');
          },
          error: (err) => {
            console.error('Failed to fetch fresh profile:', err);
            this.saving.set(false);
            this.toast.success('Profile updated! (but could not refresh)');
          }
        });
      },
      error: (err) => { 
        this.saving.set(false);
        console.error('Update error:', err);
        this.toast.error('Update failed.'); 
      }
    });
  }

  changePassword(): void {
    if (!this.currentPwd() || !this.newPwd()) return;
    this.changingPwd.set(true);
    this.auth.changePassword({ 
      currentPassword: this.currentPwd(), 
      newPassword: this.newPwd() 
    }).subscribe({
      next: () => {
        this.changingPwd.set(false);
        this.toast.success('Password updated!');
        this.currentPwd.set('');
        this.newPwd.set('');
      },
      error: () => { 
        this.changingPwd.set(false);
        this.toast.error('Password change failed.'); 
      }
    });
  }
}