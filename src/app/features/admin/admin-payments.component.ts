import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { NavigationService } from '../../core/services/navigation.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { ToastService } from '../../core/services/toast.service';
import { PaymentResponse, PlatformRevenue } from '../../core/payment.models';
import { FormatDatePipe } from '../../shared/pipes/status.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-admin-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent, IconComponent, ConfirmModalComponent, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="mb-8">
          <h1 class="page-title">Payments & Revenue</h1>
          <p class="page-subtitle">Platform-wide payment analytics and management</p>
        </div>

        <!-- Revenue summary -->
        @if (revenue) {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div class="card sm:col-span-1">
              <div class="w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center mb-3">
                <app-icon name="trending-up" [size]="18" class="text-navy-700"></app-icon>
              </div>
              <p class="text-2xl font-bold text-slate-900">₹{{ revenue.totalRevenue | number:'1.0-0' }}</p>
              <p class="text-xs text-slate-500 uppercase tracking-wide font-medium mt-0.5">Total Platform Revenue</p>
            </div>

            <div class="card sm:col-span-2">
              <p class="section-label">Monthly Revenue</p>
              @if (revenue.monthlyBreakdown.length === 0) {
                <p class="text-slate-400 text-sm">No revenue data yet.</p>
              }
              <div class="space-y-2">
                @for (m of revenue.monthlyBreakdown.slice(0, 6); track m.month) {
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-slate-600 font-medium">{{ m.monthName }} {{ m.year }}</span>
                      <span class="text-slate-500">₹{{ m.revenue | number:'1.0-0' }}</span>
                    </div>
                    <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div class="h-full bg-navy-600 rounded-full transition-all duration-500"
                           [style.width.%]="(m.revenue / maxRevenue) * 100"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        @if (revenueLoading) {
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-32"></div> }
          </div>
        }

        <!-- Filters row -->
        <div class="flex flex-wrap items-center gap-3 mb-4">
          <input type="text" [(ngModel)]="searchTerm" (input)="applyFilter()"
                 placeholder="Search by patient, provider or transaction ID…"
                 class="input-field max-w-xs">
          <select [(ngModel)]="statusFilter" (change)="applyFilter()" class="input-field w-40">
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <span class="text-xs text-slate-400 ml-auto">{{ filtered.length }} records</span>
        </div>

        <!-- Table -->
        <div class="card p-0 overflow-hidden">
          @if (paymentsLoading || namesLoading) {
            <div class="p-6 space-y-3">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="h-10 bg-slate-100 rounded-lg animate-pulse"></div>
              }
            </div>
          }

          @if (!paymentsLoading && !namesLoading && filtered.length === 0) {
            <div class="text-center py-14 text-slate-400">
              <app-icon name="dollar-sign" [size]="28" class="mx-auto mb-3 opacity-50"></app-icon>
              <p>No payments found.</p>
            </div>
          }

          @if (!paymentsLoading && !namesLoading && filtered.length > 0) {
            <div class="table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Patient</th>
                    <th>Provider</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Paid At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of filtered; track p.paymentId) {
                    <tr [ngClass]="p.status === 'PENDING' ? 'bg-amber-50/40' : ''">
                      <td class="font-mono text-xs text-slate-400">#{{ p.paymentId }}</td>
                      <td>
                        <div class="flex flex-col">
                          <span class="text-sm font-medium text-slate-800">
                            {{ patientNames[p.patientId] ?? 'Patient #' + p.patientId }}
                          </span>
                          <span class="text-xs text-slate-400">Appt #{{ p.appointmentId }}</span>
                        </div>
                      </td>
                      <td>
                        <span class="text-sm text-slate-700">
                          {{ providerNames[p.providerId] ?? 'Provider #' + p.providerId }}
                        </span>
                      </td>
                      <td class="font-semibold text-slate-800">₹{{ p.amount }}</td>
                      <td>
                        <span class="text-xs font-medium text-slate-600 flex items-center gap-1">
                          <app-icon [name]="modeIcon(p.mode)" [size]="12" class="text-slate-400"></app-icon>
                          {{ p.mode }}
                        </span>
                      </td>
                      <td>
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border"
                              [ngClass]="p.status === 'PAID'      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                       : p.status === 'REFUNDED'  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                       : p.status === 'PENDING'   ? 'bg-amber-50 text-amber-700 border-amber-200'
                                       : 'bg-slate-100 text-slate-500 border-slate-200'">
                          {{ p.status }}
                        </span>
                      </td>
                      <td class="text-xs text-slate-500">{{ p.paidAt ? (p.paidAt | formatDate) : '—' }}</td>
                      <td>
                        <div class="flex gap-1.5">
                          @if (p.status === 'PENDING') {
                            <button (click)="forceStatus(p, 'PAID')"
                                    class="text-xs text-emerald-600 hover:underline font-medium">
                              Mark Paid
                            </button>
                          }
                          @if (p.status === 'PAID') {
                            <button (click)="openRefund(p)"
                                    class="text-xs text-blue-600 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                              Refund
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

      </div>
    </app-sidebar-layout>

    <app-confirm-modal
      [open]="refundModal"
      title="Issue Refund"
      message="This will trigger a refund via Razorpay for the full payment amount. This cannot be undone."
      confirmText="Issue Refund"
      cancelText="Cancel"
      [danger]="true"
      [requireReason]="true"
      reasonLabel="Reason for refund"
      reasonPlaceholder="e.g. Appointment cancelled by provider, duplicate charge…"
      (confirmed)="confirmRefund($event)"
      (cancelled)="refundModal = false">
    </app-confirm-modal>
  `
})
export class AdminPaymentsComponent implements OnInit {
  private navigationService = inject(NavigationService);
  private paymentService = inject(PaymentService);
  private authService = inject(AuthService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  revenue: PlatformRevenue | null = null;
  revenueLoading = true;
  payments: PaymentResponse[] = [];
  filtered: PaymentResponse[] = [];
  paymentsLoading = true;
  namesLoading = true;

  patientNames: Record<number, string | undefined> = {};
  providerNames: Record<number, string | undefined> = {};

  searchTerm = '';
  statusFilter = '';

  refundModal = false;
  refundTarget: PaymentResponse | null = null;

  get maxRevenue(): number {
    return Math.max(...(this.revenue?.monthlyBreakdown.map(m => m.revenue) ?? [1]), 1);
  }

  ngOnInit(): void {
    this.paymentService.getPlatformRevenue().subscribe({
      next: (r) => { this.revenue = r; this.revenueLoading = false; },
      error: () => { this.revenueLoading = false; }
    });

    this.paymentService.getAll().subscribe({
      next: (p) => {
        this.payments = p;
        this.filtered = p;
        this.paymentsLoading = false;
        this.loadNames();
      },
      error: () => { this.paymentsLoading = false; this.namesLoading = false; }
    });
  }

  private loadNames(): void {
    forkJoin({
      patients: this.authService.getAdminUsers('PATIENT'),
      providers: this.providerService.getAll(),
    }).subscribe({
      next: ({ patients, providers }) => {
        patients.forEach(u => {
          this.patientNames[Number(u.userId)] = u.fullName;
        });
        providers.forEach(p => {
          this.providerNames[Number(p.providerId)] = p.providerName ?? `Provider #${p.providerId}`;
        });
        this.namesLoading = false;
      },
      error: () => { this.namesLoading = false; }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.payments.filter(p => {
      const matchesStatus = !this.statusFilter || p.status === this.statusFilter;
      const patientName = (this.patientNames[p.patientId] ?? '').toLowerCase();
      const providerName = (this.providerNames[p.providerId] ?? '').toLowerCase();
      const matchesSearch = !term
        || patientName.includes(term)
        || providerName.includes(term)
        || (p.transactionId ?? '').toLowerCase().includes(term)
        || String(p.appointmentId).includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  openRefund(p: PaymentResponse): void {
    this.refundTarget = p;
    this.refundModal = true;
  }

  confirmRefund(reason: string): void {
    this.refundModal = false;
    const p = this.refundTarget!;
    this.paymentService.refund(p.appointmentId, reason).subscribe({
      next: () => {
        const idx = this.payments.findIndex(x => x.paymentId === p.paymentId);
        if (idx !== -1) this.payments[idx] = { ...this.payments[idx], status: 'REFUNDED' as any };
        this.applyFilter();
        this.toast.success(`Refund issued for payment #${p.paymentId}.`);
        this.refundTarget = null;
      },
      error: (err) => {
        const msg: string = err?.error?.error || err?.message || '';
        if (msg.toLowerCase().includes('razorpay') || msg.toLowerCase().includes('cash')) {
          // Razorpay call failed or CASH payment — fall back to admin status override
          this.paymentService.updateStatus(p.paymentId, 'REFUNDED').subscribe({
            next: () => {
              const idx = this.payments.findIndex(x => x.paymentId === p.paymentId);
              if (idx !== -1) this.payments[idx] = { ...this.payments[idx], status: 'REFUNDED' as any };
              this.applyFilter();
              this.toast.success(`Payment #${p.paymentId} marked as refunded (manual override).`);
              this.refundTarget = null;
            },
            error: () => this.toast.error('Refund failed. Could not override status.')
          });
        } else {
          this.toast.error(msg || 'Refund failed. Please try again.');
        }
      }
    });
  }

  forceStatus(p: PaymentResponse, value: string): void {    this.paymentService.updateStatus(p.paymentId, value).subscribe({
      next: () => {
        p.status = value as any;
        this.applyFilter();
        this.toast.success(`Payment #${p.paymentId} marked as ${value}.`);
      },
      error: () => this.toast.error('Failed to update status.')
    });
  }

  modeIcon(mode: string): string {
    return { UPI: 'phone', CARD: 'dollar-sign', WALLET: 'shield', CASH: 'activity' }[mode] ?? 'dollar-sign';
  }
}