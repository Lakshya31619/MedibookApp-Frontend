import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-navy-50 to-white flex items-center justify-center p-4">
      <div class="w-full max-w-md page-enter">

        <!-- Header -->
        <div class="text-center mb-8">
          <a routerLink="/" class="inline-flex items-center gap-2 mb-6">
            <div class="w-10 h-10 bg-navy-700 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold">M</span>
            </div>
            <span class="font-serif text-2xl text-navy-700">MediBook</span>
          </a>
          <div class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">📧</span>
          </div>
          <h1 class="text-3xl font-serif text-navy-700">Verify your email</h1>
          <p class="text-gray-500 mt-2 text-sm">
            We sent a 6-digit code to<br>
            <span class="font-semibold text-navy-700">{{ email }}</span>
          </p>
        </div>

        <div class="card shadow-lg border-0">

          <!-- OTP inputs -->
          <div class="flex justify-center gap-3 mb-6">
            @for (i of [0,1,2,3,4,5]; track i) {
              <input
                type="text"
                inputmode="numeric"
                maxlength="1"
                [id]="'otp-' + i"
                [(ngModel)]="digits[i]"
                [name]="'digit' + i"
                (input)="onDigitInput($event, i)"
                (keydown)="onKeyDown($event, i)"
                (paste)="onPaste($event)"
                class="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl
                       focus:outline-none focus:border-navy-700 transition-colors
                       bg-gray-50 text-navy-800"
                [ngClass]="digits[i] ? 'border-navy-400 bg-navy-50' : 'border-gray-200'"
                autocomplete="off">
            }
          </div>

          @if (error) {
            <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4 text-center">
              {{ error }}
            </div>
          }

          @if (successMsg) {
            <div class="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4 text-center">
              ✅ {{ successMsg }}
            </div>
          }

          <!-- Verify button -->
          <button (click)="onVerify()" [disabled]="loading || codeLength < 6"
            class="btn-primary w-full mb-4"
            [class.opacity-50]="codeLength < 6">
            {{ loading ? 'Verifying…' : 'Verify Email' }}
          </button>

          <!-- Resend section -->
          <div class="text-center text-sm text-gray-500">
            Didn't receive the code?
            @if (resendCooldown > 0) {
              <span class="text-gray-400 ml-1">Resend in {{ resendCooldown }}s</span>
            } @else {
              <button (click)="onResend()" [disabled]="resendLoading"
                class="text-navy-700 font-medium hover:underline ml-1">
                {{ resendLoading ? 'Sending…' : 'Resend code' }}
              </button>
            }
          </div>

          <p class="text-center text-xs text-gray-400 mt-4">
            Wrong email?
            <a routerLink="/register" class="text-navy-700 hover:underline">Go back to register</a>
          </p>
        </div>

        <!-- Info note -->
        <p class="text-center text-xs text-gray-400 mt-4">
          ⏱ Code expires in 10 minutes
        </p>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  digits: string[] = ['', '', '', '', '', ''];

  loading = false;
  resendLoading = false;
  error = '';
  successMsg = '';
  resendCooldown = 0;

  private cooldownInterval?: ReturnType<typeof setInterval>;

  get codeLength(): number {
    return this.digits.filter(d => d.length === 1).length;
  }

  get code(): string {
    return this.digits.join('');
  }

  ngOnInit(): void {
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    this.digits[index] = val.slice(-1);
    input.value = this.digits[index];

    if (this.digits[index] && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      next?.focus();
    }

    // Auto-submit when all 6 filled
    if (this.codeLength === 6) {
      setTimeout(() => this.onVerify(), 100);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.digits[index - 1] = '';
      const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      prev?.focus();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 6) ?? '';
    pasted.split('').forEach((ch, i) => {
      if (i < 6) this.digits[i] = ch;
    });
    const lastIdx = Math.min(pasted.length - 1, 5);
    const target = document.getElementById(`otp-${lastIdx}`) as HTMLInputElement;
    target?.focus();

    if (this.codeLength === 6) {
      setTimeout(() => this.onVerify(), 100);
    }
  }

  onVerify(): void {
    if (this.codeLength < 6 || this.loading) return;
    this.error = '';
    this.loading = true;

    this.auth.verifyEmail(this.email, this.code).subscribe({
      next: (res) => {
        this.loading = false;
        this.successMsg = res.message;
        this.toast.success('Email verified! You can now log in.');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Verification failed. Please try again.';
        // Clear digits on error
        this.digits = ['', '', '', '', '', ''];
        setTimeout(() => {
          const first = document.getElementById('otp-0') as HTMLInputElement;
          first?.focus();
        }, 50);
      }
    });
  }

  onResend(): void {
    this.error = '';
    this.resendLoading = true;

    this.auth.sendVerificationCode(this.email).subscribe({
      next: () => {
        this.resendLoading = false;
        this.toast.success('New code sent! Check your inbox.');
        this.digits = ['', '', '', '', '', ''];
        this.startCooldown(60);
        setTimeout(() => {
          const first = document.getElementById('otp-0') as HTMLInputElement;
          first?.focus();
        }, 50);
      },
      error: (err) => {
        this.resendLoading = false;
        this.error = err.error?.error || 'Failed to resend code. Please try again.';
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.resendCooldown = seconds;
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.cooldownInterval);
        this.resendCooldown = 0;
      }
    }, 1000);
  }
}