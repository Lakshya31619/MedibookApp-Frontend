import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { EarningsSummary, PaymentSummary } from '../../core/payment.models';
import { FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-earnings',
  standalone: true,
  imports: [CommonModule, SidebarLayoutComponent, IconComponent, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="mb-8">
          <h1 class="page-title">Earnings</h1>
          <p class="page-subtitle">Your payment history and earnings summary</p>
        </div>

        <!-- Summary cards -->
        @if (summary) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div class="card">
              <div class="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                <app-icon name="trending-up" [size]="18" class="text-emerald-600"></app-icon>
              </div>
              <p class="text-2xl font-bold text-slate-900">₹{{ summary.totalEarned | number:'1.0-0' }}</p>
              <p class="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">Total Earned</p>
            </div>
            <div class="card">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <app-icon name="dollar-sign" [size]="18" class="text-blue-600"></app-icon>
              </div>
              <p class="text-2xl font-bold text-slate-900">₹{{ summary.netEarnings | number:'1.0-0' }}</p>
              <p class="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">Net Earnings</p>
            </div>
            <div class="card">
              <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
                <app-icon name="clock" [size]="18" class="text-amber-600"></app-icon>
              </div>
              <p class="text-2xl font-bold text-slate-900">₹{{ summary.pendingAmount | number:'1.0-0' }}</p>
              <p class="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">Pending (Cash)</p>
            </div>
            <div class="card">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                <app-icon name="refresh-cw" [size]="18" class="text-red-500"></app-icon>
              </div>
              <p class="text-2xl font-bold text-slate-900">₹{{ summary.totalRefunded | number:'1.0-0' }}</p>
              <p class="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wide">Refunded</p>
            </div>
          </div>
        }

        @if (summaryLoading) {
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            @for (i of [1,2,3,4]; track i) {
              <div class="card animate-pulse h-28"></div>
            }
          </div>
        }

        <!-- Payment history table -->
        <div class="card">
          <div class="flex items-center justify-between mb-5">
            <h2 class="font-serif text-xl text-navy-800">Payment History</h2>
            <span class="text-xs text-slate-400">{{ payments.length }} records</span>
          </div>

          @if (paymentsLoading) {
            <div class="space-y-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
              }
            </div>
          }

          @if (!paymentsLoading && payments.length === 0) {
            <div class="text-center py-10">
              <div class="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <app-icon name="dollar-sign" [size]="20" class="text-slate-400"></app-icon>
              </div>
              <p class="text-slate-400 text-sm">No payment records yet.</p>
            </div>
          }

          @if (!paymentsLoading && payments.length > 0) {
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Appt. ID</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of payments; track p.paymentId) {
                    <tr>
                      <td class="font-mono text-xs text-slate-500">#{{ p.appointmentId }}</td>
                      <td class="font-semibold text-slate-800">₹{{ p.amount }}</td>
                      <td>
                        <span class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <app-icon [name]="modeIcon(p.mode)" [size]="13" class="text-slate-400"></app-icon>
                          {{ p.mode }}
                        </span>
                      </td>
                      <td>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                              [ngClass]="p.status === 'PAID'      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                       : p.status === 'REFUNDED'  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                       : p.status === 'PENDING'   ? 'bg-amber-50 text-amber-700 border-amber-200'
                                       : 'bg-slate-100 text-slate-500 border-slate-200'">
                          {{ p.status }}
                        </span>
                      </td>
                      <td class="text-xs text-slate-500">{{ p.paidAt ? (p.paidAt | formatDate) : '—' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>
    </app-sidebar-layout>
  `
})
export class ProviderEarningsComponent implements OnInit {
  private auth = inject(AuthService);
  private providerService = inject(ProviderService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard',      iconName: 'home',        route: '/provider/dashboard' },
    { label: 'Appointments',   iconName: 'calendar',    route: '/provider/appointments' },
    { label: 'Slot Management',iconName: 'grid',        route: '/provider/slots' },
    { label: 'Earnings',       iconName: 'trending-up', route: '/provider/earnings' },
    { label: 'My Profile',     iconName: 'user',        route: '/provider/profile' },
  ];

  summary: EarningsSummary | null = null;
  summaryLoading = true;
  payments: PaymentSummary[] = [];
  paymentsLoading = true;

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerService.getMyProfile(userId).subscribe({
      next: (profile) => {
        const pid = Number(profile.providerId);

        this.paymentService.getEarnings(pid).subscribe({
          next: (s) => { this.summary = s; this.summaryLoading = false; },
          error: () => { this.summaryLoading = false; }
        });

        this.paymentService.getByProvider(pid).subscribe({
          next: (p) => { this.payments = p; this.paymentsLoading = false; },
          error: () => { this.paymentsLoading = false; }
        });
      },
      error: () => { this.summaryLoading = false; this.paymentsLoading = false; }
    });
  }

  modeIcon(mode: string): string {
    return { UPI: 'phone', CARD: 'dollar-sign', WALLET: 'shield', CASH: 'activity' }[mode] ?? 'dollar-sign';
  }
}