import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-navy-50 to-white flex items-center justify-center p-4">
      <div class="w-full max-w-md page-enter">
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-6">
            <div class="w-10 h-10 bg-navy-700 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold">M</span>
            </div>
            <span class="font-serif text-2xl text-navy-700">MediBook</span>
          </a>
          <h1 class="text-3xl font-serif text-navy-700">Create Account</h1>
          <p class="text-gray-500 mt-1">Join MediBook today</p>
        </div>

        <div class="card shadow-lg border-0">
          <!-- Role selector -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <button type="button" (click)="role = 'PATIENT'"
              class="py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all"
              [ngClass]="role === 'PATIENT' ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'">
              🏥 I'm a Patient
            </button>
            <button type="button" (click)="role = 'PROVIDER'"
              class="py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all"
              [ngClass]="role === 'PROVIDER' ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'">
              👨‍⚕️ I'm a Doctor
            </button>
          </div>

          <form (ngSubmit)="onRegister()">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" [(ngModel)]="fullName" name="fullName" class="input-field"
                placeholder="Dr. Jane Smith" required>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" [(ngModel)]="email" name="email" class="input-field"
                placeholder="you@example.com" required>
              @if (fieldErrors['email']) {
                <p class="text-red-500 text-xs mt-1">{{ fieldErrors['email'] }}</p>
              }
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input type="tel" [(ngModel)]="phone" name="phone" class="input-field"
                placeholder="+91 9876543210">
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div class="relative">
                <input [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password"
                  class="input-field pr-10" placeholder="Min. 8 characters" required minlength="8">
                <button type="button" (click)="showPwd = !showPwd"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {{ showPwd ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (fieldErrors['password']) {
                <p class="text-red-500 text-xs mt-1">{{ fieldErrors['password'] }}</p>
              }
            </div>

            @if (error) {
              <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
                {{ error }}
              </div>
            }

            <button type="submit" [disabled]="loading" class="btn-primary w-full">
              {{ loading ? 'Creating account…' : 'Create Account' }}
            </button>
          </form>

          @if (role === 'PROVIDER') {
            <div class="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
              ℹ️ Provider accounts require admin approval before you can see patients.
            </div>
          }

          <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account?
            <a routerLink="/login" class="text-navy-700 font-medium hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  fullName = '';
  email = '';
  phone = '';
  password = '';
  role: 'PATIENT' | 'PROVIDER' = 'PATIENT';
  showPwd = false;
  loading = false;
  error = '';
  fieldErrors: Record<string, string> = {};

  ngOnInit(): void {
    const roleParam = this.route.snapshot.queryParamMap.get('role');
    if (roleParam === 'PROVIDER') this.role = 'PROVIDER';
  }

  onRegister(): void {
    this.error = '';
    this.fieldErrors = {};
    this.loading = true;
    this.auth.register({ fullName: this.fullName, email: this.email, password: this.password, phone: this.phone || undefined, role: this.role }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Account created! Please sign in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        if (err.error?.errors) {
          this.fieldErrors = err.error.errors;
          this.error = 'Please fix the errors above.';
        } else {
          this.error = err.error?.error || 'Registration failed. Please try again.';
        }
      }
    });
  }
}
