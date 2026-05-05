import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ProviderService } from '../../core/services/provider.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { EarningsSummary, PaymentSummary } from '../../core/payment.models';
import { FormatDatePipe } from '../../shared/pipes/status.pipe';

interface MonthBucket {
  key: string;       // "2025-04"
  label: string;     // "Apr"
  year: number;
  total: number;
}

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

        <!-- Monthly earnings chart -->
        <div class="card mb-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="font-serif text-xl text-navy-800">Monthly Earnings</h2>
              <p class="text-xs text-slate-400 mt-0.5">Paid payments only · last 6 months</p>
            </div>
            @if (!paymentsLoading && monthlyBuckets.length > 0) {
              <div class="text-right">
                <p class="text-xs text-slate-400 uppercase tracking-wide">Best month</p>
                <p class="text-sm font-semibold text-navy-700">{{ bestMonth?.label }} {{ bestMonth?.year }} · ₹{{ bestMonth?.total | number:'1.0-0' }}</p>
              </div>
            }
          </div>

          @if (paymentsLoading) {
            <div class="flex items-end gap-2" style="height:160px">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="flex-1 bg-gray-100 rounded-t animate-pulse" [style.height.px]="40 + i * 16"></div>
              }
            </div>
          } @else if (monthlyBuckets.length === 0) {
            <div class="flex flex-col items-center justify-center text-slate-400 gap-2" style="height:160px">
              <app-icon name="trending-up" [size]="28" class="text-slate-300"></app-icon>
              <p class="text-sm">No paid payments yet.</p>
            </div>
          } @else {
            <div class="flex items-end gap-2" style="height:160px">
              @for (b of monthlyBuckets; track b.key) {
                <div class="flex-1 flex flex-col items-center gap-1 group" style="height:100%">
                  <div class="flex-1"></div>
                  <div
                    class="w-full rounded-t relative overflow-visible cursor-default transition-all duration-700"
                    [style.height.px]="maxBucketTotal ? Math.max(4, (b.total / maxBucketTotal) * 148) : 4">
                    <!-- Tooltip -->
                    <div class="absolute -top-9 left-1/2 -translate-x-1/2 bg-navy-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      ₹{{ b.total | number:'1.0-0' }}
                    </div>
                    <div class="absolute inset-0 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t opacity-90 group-hover:from-emerald-700 group-hover:to-emerald-500 transition-all duration-200"></div>
                  </div>
                  <span class="text-[10px] text-slate-400 truncate w-full text-center leading-none pb-0.5">{{ b.label }}</span>
                </div>
              }
            </div>
          }
        </div>

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
  readonly Math = Math;

  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private providerService = inject(ProviderService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  summary: EarningsSummary | null = null;
  summaryLoading = true;
  payments: PaymentSummary[] = [];
  paymentsLoading = true;
  monthlyBuckets: MonthBucket[] = [];

  get maxBucketTotal(): number {
    return Math.max(...this.monthlyBuckets.map(b => b.total), 1);
  }

  get bestMonth(): MonthBucket | null {
    if (!this.monthlyBuckets.length) return null;
    return this.monthlyBuckets.reduce((a, b) => b.total > a.total ? b : a);
  }

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
          next: (p) => {
            this.payments = p;
            this.monthlyBuckets = this.buildMonthlyBuckets(p);
            this.paymentsLoading = false;
          },
          error: () => { this.paymentsLoading = false; }
        });
      },
      error: () => { this.summaryLoading = false; this.paymentsLoading = false; }
    });
  }

  private buildMonthlyBuckets(payments: PaymentSummary[]): MonthBucket[] {
    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Bucket paid payments by year-month
    const map = new Map<string, number>();
    for (const p of payments) {
      if (p.status !== 'PAID' || !p.paidAt) continue;
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map.set(key, (map.get(key) ?? 0) + p.amount);
    }

    // Build last 6 calendar months (including current), filling gaps with 0
    const now = new Date();
    const buckets: MonthBucket[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.push({
        key,
        label: MONTH_NAMES[d.getMonth()],
        year: d.getFullYear(),
        total: map.get(key) ?? 0,
      });
    }
    return buckets;
  }

  modeIcon(mode: string): string {
    return { UPI: 'phone', CARD: 'dollar-sign', WALLET: 'shield', CASH: 'activity' }[mode] ?? 'dollar-sign';
  }
}