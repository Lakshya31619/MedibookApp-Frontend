import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { StarRatingComponent } from '../../shared/components/star-rating.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ProviderService } from '../../core/services/provider.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentSummary } from '../../core/models';
import { ReviewResponse } from '../../core/review.models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-appointments',
  standalone: true,
  imports: [CommonModule, SidebarLayoutComponent, IconComponent, StarRatingComponent,
            ConfirmModalComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="mb-6">
          <h1 class="page-title">Appointments</h1>
          <p class="page-subtitle">Manage your patient appointments and reviews</p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'today'"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [ngClass]="tab === 'today' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500'">
            Today ({{ today.length }})
          </button>
          <button (click)="tab = 'all'; loadAll()"
                  class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                  [ngClass]="tab === 'all' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500'">
            All
          </button>
        </div>

        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-24"></div> }
          </div>
        }

        @if (!loading) {
          @if ((tab === 'today' ? today : all).length === 0) {
            <div class="card text-center py-14">
              <app-icon name="calendar" [size]="28" class="text-slate-300 mx-auto mb-3"></app-icon>
              <p class="text-slate-400">No appointments found.</p>
            </div>
          }
          <div class="space-y-3">
            @for (appt of (tab === 'today' ? today : all); track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col gap-3">
                  <!-- Appointment row -->
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                           [ngClass]="appt.status === 'SCHEDULED' ? 'bg-navy-50' : 'bg-slate-100'">
                        <app-icon [name]="appt.modeOfConsultation === 'VIDEO' ? 'video' : 'stethoscope'"
                                  [size]="18"
                                  [ngClass]="appt.status === 'SCHEDULED' ? 'text-navy-600' : 'text-slate-400'">
                        </app-icon>
                      </div>
                      <div>
                        <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                          @if (paymentStatuses[appt.appointmentId]) {
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full border"
                                  [ngClass]="paymentStatuses[appt.appointmentId] === 'PAID'
                                             ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                             : paymentStatuses[appt.appointmentId] === 'PENDING'
                                             ? 'bg-amber-50 text-amber-700 border-amber-200'
                                             : paymentStatuses[appt.appointmentId] === 'REFUNDED'
                                             ? 'bg-blue-50 text-blue-700 border-blue-200'
                                             : 'bg-slate-100 text-slate-500 border-slate-200'">
                              {{ paymentStatuses[appt.appointmentId] === 'PENDING' ? '⚠ Unpaid' : paymentStatuses[appt.appointmentId] }}
                            </span>
                          }
                        </div>
                        <p class="font-semibold text-slate-900 text-sm">{{ appt.serviceType }}</p>
                        <p class="text-xs text-slate-500 mt-0.5">
                          {{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }} – {{ appt.endTime | formatTime }}
                        </p>
                      </div>
                    </div>

                    @if (appt.status === 'SCHEDULED') {
                      <div class="flex gap-2 flex-shrink-0">
                        <button (click)="markComplete(appt)" class="btn-primary text-xs py-1.5 px-3">
                          <app-icon name="check" [size]="13"></app-icon> Complete
                        </button>
                        <button (click)="openNoShow(appt)" class="btn-secondary text-xs py-1.5 px-3">
                          No-Show
                        </button>
                      </div>
                    }
                  </div>

                  <!-- Review section for COMPLETED appointments -->
                  @if (appt.status === 'COMPLETED' && existingReviews[appt.appointmentId]) {
                    <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 ml-13">
                      <div class="flex items-start justify-between gap-3">
                        <div class="flex-1">
                          <div class="flex items-center gap-2 mb-1">
                            <app-star-rating [value]="existingReviews[appt.appointmentId].rating" [size]="14"></app-star-rating>
                            @if (existingReviews[appt.appointmentId].isVerified) {
                              <span class="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                <app-icon name="shield-check" [size]="11"></app-icon> Verified
                              </span>
                            }
                            @if (existingReviews[appt.appointmentId].isFlagged) {
                              <span class="text-xs text-red-500 font-medium flex items-center gap-1">
                                <app-icon name="alert-circle" [size]="11"></app-icon> Flagged
                              </span>
                            }
                          </div>
                          @if (existingReviews[appt.appointmentId].comment) {
                            <p class="text-xs text-slate-600 leading-relaxed">{{ existingReviews[appt.appointmentId].comment }}</p>
                          }
                        </div>
                        <!-- Review action buttons -->
                        <div class="flex gap-1.5 flex-shrink-0">
                          @if (!existingReviews[appt.appointmentId].isVerified) {
                            <button (click)="verifyReview(existingReviews[appt.appointmentId])"
                                    class="text-xs text-emerald-600 hover:underline font-medium px-2 py-1 rounded hover:bg-emerald-50 transition-colors">
                              Verify
                            </button>
                          }
                          @if (!existingReviews[appt.appointmentId].isFlagged) {
                            <button (click)="openFlag(existingReviews[appt.appointmentId])"
                                    class="text-xs text-amber-600 hover:underline font-medium px-2 py-1 rounded hover:bg-amber-50 transition-colors">
                              Flag
                            </button>
                          } @else {
                            <button (click)="unflagReview(existingReviews[appt.appointmentId])"
                                    class="text-xs text-slate-500 hover:underline font-medium px-2 py-1 rounded hover:bg-slate-100 transition-colors">
                              Unflag
                            </button>
                          }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </app-sidebar-layout>

    <!-- No-Show Confirm Modal -->
    <app-confirm-modal
      [open]="noShowModal"
      title="Mark as No-Show"
      message="Mark this patient as a no-show? This cannot be undone and the patient will be notified."
      confirmText="Mark No-Show"
      cancelText="Cancel"
      [danger]="true"
      (confirmed)="confirmNoShow()"
      (cancelled)="noShowModal = false">
    </app-confirm-modal>

    <!-- Flag Review Modal -->
    <app-confirm-modal
      [open]="flagModal"
      title="Flag Review"
      message="Flag this review for moderation. Provide a reason below."
      confirmText="Flag Review"
      cancelText="Cancel"
      [danger]="false"
      [requireReason]="true"
      reasonLabel="Reason for flagging"
      reasonPlaceholder="e.g. Inappropriate content, spam, fake review…"
      (confirmed)="confirmFlag($event)"
      (cancelled)="flagModal = false">
    </app-confirm-modal>
  `
})
export class ProviderAppointmentsComponent implements OnInit {
  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private providerSvc = inject(ProviderService);
  private apptSvc = inject(AppointmentService);
  private paymentSvc = inject(PaymentService);
  private reviewSvc = inject(ReviewService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  tab: 'today' | 'all' = 'today';
  today: AppointmentSummary[] = [];
  all: AppointmentSummary[] = [];
  loading = true;
  providerId: number = 0;

  paymentStatuses: Record<string, string> = {};
  existingReviews: Record<string, ReviewResponse> = {};

  flagModal = false;
  flagTarget: ReviewResponse | null = null;

  noShowModal = false;
  noShowTarget: AppointmentSummary | null = null;

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerSvc.getMyProfile(userId).subscribe({
      next: (p) => {
        this.providerId = p.providerId;
        this.apptSvc.getProviderToday(p.providerId).subscribe({
          next: (a) => { this.today = a; this.loading = false; this.loadReviews(a); this.loadPaymentStatuses(a); },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  loadAll(): void {
    if (this.all.length || !this.providerId) return;
    this.apptSvc.getProviderAppointments(this.providerId).subscribe({
      next: (a) => { this.all = a; this.loadReviews(a); this.loadPaymentStatuses(a); }
    });
  }

  loadPaymentStatuses(appointments: AppointmentSummary[]): void {
    appointments.forEach(a => {
      this.paymentSvc.getStatus(Number(a.appointmentId)).subscribe({
        next: (res) => { this.paymentStatuses[a.appointmentId] = res.status; },
        error: () => {}
      });
    });
  }

  loadReviews(appointments: AppointmentSummary[]): void {
    appointments
      .filter(a => a.status === 'COMPLETED')
      .forEach(a => {
        this.reviewSvc.getByAppointment(Number(a.appointmentId)).subscribe({
          next: (r) => { this.existingReviews[a.appointmentId] = r; },
          error: () => {}
        });
      });
  }

  markComplete(appt: AppointmentSummary): void {
    this.apptSvc.complete(appt.appointmentId).subscribe({
      next: () => { this.updateStatus(appt.appointmentId, 'COMPLETED'); this.toast.success('Marked as completed.'); },
      error: () => this.toast.error('Failed.')
    });
  }

  openNoShow(appt: AppointmentSummary): void {
    this.noShowTarget = appt;
    this.noShowModal = true;
  }

  confirmNoShow(): void {
    this.noShowModal = false;
    const appt = this.noShowTarget!;
    this.apptSvc.markNoShow(appt.appointmentId).subscribe({
      next: () => { this.updateStatus(appt.appointmentId, 'NO_SHOW'); this.toast.info('Marked as no-show.'); this.noShowTarget = null; },
      error: () => this.toast.error('Failed.')
    });
  }

  verifyReview(review: ReviewResponse): void {
    this.reviewSvc.verifyReview(review.reviewId).subscribe({
      next: () => {
        this.existingReviews[review.appointmentId] = { ...review, isVerified: true };
        this.toast.success('Review verified.');
      },
      error: (err) => {
        console.error('Error verifying review:', err);
        this.toast.error('Failed to verify review. Refreshing to check status...');
        setTimeout(() => this.refreshReview(review), 500);
      }
    });
  }

  openFlag(review: ReviewResponse): void { this.flagTarget = review; this.flagModal = true; }

  confirmFlag(reason: string): void {
    this.flagModal = false;
    const review = this.flagTarget!;
    this.reviewSvc.flagReview(review.reviewId, reason).subscribe({
      next: () => {
        this.existingReviews[review.appointmentId] = { ...review, isFlagged: true, flagReason: reason };
        this.toast.success('Review flagged for moderation.');
      },
      error: (err) => {
        console.error('Error flagging review:', err);
        this.toast.error('Failed to flag review. Refreshing to check status...');
        setTimeout(() => this.refreshReview(review), 500);
      }
    });
  }

  unflagReview(review: ReviewResponse): void {
    this.reviewSvc.unflagReview(review.reviewId).subscribe({
      next: () => {
        this.existingReviews[review.appointmentId] = { ...review, isFlagged: false, flagReason: null };
        this.toast.info('Review unflagged.');
      },
      error: (err) => {
        console.error('Error unflagging review:', err);
        this.toast.error('Failed to unflag review. Refreshing to check status...');
        setTimeout(() => this.refreshReview(review), 500);
      }
    });
  }

  private refreshReview(review: ReviewResponse): void {
    this.reviewSvc.getByAppointment(review.appointmentId).subscribe({
      next: (refreshed) => {
        this.existingReviews[review.appointmentId] = refreshed;
      },
      error: (err) => {
        console.error('Error refreshing review:', err);
      }
    });
  }

  private updateStatus(id: number, status: string): void {
    const update = (list: AppointmentSummary[]) => {
      const idx = list.findIndex(a => a.appointmentId === id);
      if (idx !== -1) list[idx] = { ...list[idx], status: status as any };
    };
    update(this.today); update(this.all);
  }
}