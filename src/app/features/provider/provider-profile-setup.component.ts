import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-provider-profile-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="max-w-2xl page-enter">
        <div class="mb-8">
          <h1 class="text-3xl font-serif text-navy-700">Set Up Your Provider Profile</h1>
          <p class="text-gray-500 mt-1">Complete your profile to get verified and start accepting appointments.</p>
        </div>

        <div class="card">
          <form (ngSubmit)="onSubmit()">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                <input type="text" [(ngModel)]="form.specialization" name="specialization" class="input-field"
                  placeholder="e.g. Cardiology" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Qualification *</label>
                <input type="text" [(ngModel)]="form.qualification" name="qualification" class="input-field"
                  placeholder="e.g. MBBS, MD" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                <input type="number" [(ngModel)]="form.experienceYears" name="experienceYears" class="input-field"
                  placeholder="5" min="0" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                <input type="number" [(ngModel)]="form.consultationFee" name="consultationFee" class="input-field"
                  placeholder="500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input type="text" [(ngModel)]="form.clinicName" name="clinicName" class="input-field"
                  placeholder="Your clinic name">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Clinic Address</label>
                <input type="text" [(ngModel)]="form.clinicAddress" name="clinicAddress" class="input-field"
                  placeholder="City, State">
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea [(ngModel)]="form.bio" name="bio" rows="3" class="input-field resize-none"
                placeholder="Brief description of your practice and expertise…"></textarea>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Profile Picture URL</label>
              <input type="url" [(ngModel)]="form.profilePicUrl" name="profilePicUrl" class="input-field"
                placeholder="https://…">
            </div>

            @if (error) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{{ error }}</div>
            }

            <button type="submit" [disabled]="loading" class="btn-primary w-full">
              {{ loading ? 'Submitting…' : 'Submit for Verification' }}
            </button>
          </form>
        </div>

        <div class="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ℹ️ After submission, an admin will review your profile. You'll be able to manage slots and appointments once approved.
        </div>
      </div>
    </app-sidebar-layout>
  `
})
export class ProviderProfileSetupComponent {
  private auth = inject(AuthService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);
  private router = inject(Router);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'home', route: '/provider/dashboard' },
    { label: 'Appointments', iconName: 'calendar', route: '/provider/appointments' },
    { label: 'Slot Management', iconName: 'grid', route: '/provider/slots' },
    { label: 'Earnings', iconName: 'trending-up', route: '/provider/earnings' },
    { label: 'My Profile', iconName: 'user', route: '/provider/profile' },
  ];

  form = {
    specialization: '', qualification: '', experienceYears: 0,
    consultationFee: 0, clinicName: '', clinicAddress: '', bio: '', profilePicUrl: ''
  };
  loading = false;
  error = '';

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    const userId = this.auth.currentUser()!.userId;
    this.providerService.register({
      userId,
      specialization: this.form.specialization,
      qualification: this.form.qualification,
      experienceYears: this.form.experienceYears,
      bio: this.form.bio || undefined,
      clinicName: this.form.clinicName || undefined,
      clinicAddress: this.form.clinicAddress || undefined,
      consultationFee: this.form.consultationFee || undefined,
      profilePicUrl: this.form.profilePicUrl || undefined,
    }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Profile submitted for verification!');
        this.router.navigate(['/provider/dashboard']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Submission failed.';
      }
    });
  }
}
