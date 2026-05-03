import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { NavigationService } from '../../core/services/navigation.service';
import { StarRatingComponent } from '../../shared/components/star-rating.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { AppointmentSummary, SlotSummary } from '../../core/models';
import { ReviewResponse } from '../../core/review.models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, IconComponent,
            StarRatingComponent, ConfirmModalComponent, StatusBadgePipe, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="page-title">My Appointments</h1>
            <p class="page-subtitle">Manage your upcoming and past visits</p>
          </div>
          <a routerLink="/patient/browse" class="btn-primary text-sm">
            <app-icon name="plus" [size]="15"></app-icon>
            Book New
          </a>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'upcoming'" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'upcoming' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Upcoming ({{ upcoming.length }})
          </button>
          <button (click)="tab = 'past'; loadPast()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'past' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Past
          </button>
        </div>

        <!-- Loading skeleton -->
        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="card animate-pulse h-24"></div>
            }
          </div>
        }

        <!-- Upcoming -->
        @if (!loading && tab === 'upcoming') {
          @if (upcoming.length === 0) {
            <div class="card text-center py-14">
              <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <app-icon name="calendar" [size]="22" class="text-slate-400"></app-icon>
              </div>
              <p class="font-medium text-slate-600 mb-1">No upcoming appointments</p>
              <p class="text-sm text-slate-400 mb-5">Book your first appointment to get started.</p>
              <a routerLink="/patient/browse" class="btn-primary inline-flex text-sm">Find a Doctor</a>
            </div>
          }
          <div class="space-y-3">
            @for (appt of upcoming; track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon [name]="appt.modeOfConsultation === 'VIDEO' ? 'video' : 'stethoscope'"
                                [size]="18" class="text-navy-600"></app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5">
                        <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                      </div>
                      <p class="font-semibold text-slate-900 text-sm">{{ appt.serviceType }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }} – {{ appt.endTime | formatTime }}
                      </p>
                    </div>
                  </div>
                  @if (appt.status === 'SCHEDULED') {
                    <div class="flex gap-2 flex-shrink-0">
                      <button (click)="openReschedule(appt)" class="btn-secondary text-xs py-1.5 px-3">
                        <app-icon name="refresh-cw" [size]="13"></app-icon>
                        Reschedule
                      </button>
                      <button (click)="openCancel(appt)" class="btn-danger text-xs py-1.5 px-3">
                        <app-icon name="x" [size]="13"></app-icon>
                        Cancel
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- Past -->
        @if (!loading && tab === 'past') {
          @if (past.length === 0) {
            <div class="card text-center py-14">
              <p class="text-slate-400">No past appointments found.</p>
            </div>
          }
          <div class="space-y-3">
            @for (appt of past; track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon name="clipboard" [size]="18" class="text-slate-500"></app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5">
                        <span [ngClass]="appt.status | statusBadge">{{ appt.status }}</span>
                      </div>
                      <p class="font-semibold text-slate-900 text-sm">{{ appt.serviceType }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ appt.appointmentDate | formatDate }} · {{ appt.startTime | formatTime }}
                      </p>
                    </div>
                  </div>
                  <!-- Payment status chip -->
                  @if (paymentStatuses[appt.appointmentId]) {
                    <span class="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
                          [ngClass]="paymentStatuses[appt.appointmentId] === 'PAID'
                                     ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                     : paymentStatuses[appt.appointmentId] === 'REFUNDED'
                                     ? 'bg-blue-50 text-blue-700 border-blue-200'
                                     : 'bg-slate-100 text-slate-500 border-slate-200'">
                      {{ paymentStatuses[appt.appointmentId] }}
                    </span>
                  }
                  <!-- Review button -->
                  @if (appt.status === 'COMPLETED' && !existingReviews[appt.appointmentId]) {
                    <button (click)="openReviewModal(appt)" class="btn-primary text-xs py-1.5 px-3 flex-shrink-0 flex items-center gap-1">
                      <app-icon name="star" [size]="13"></app-icon>
                      Review
                    </button>
                  }
                </div>
              </div>
              <!-- Display existing review -->
              @if (appt.status === 'COMPLETED' && existingReviews[appt.appointmentId]) {
                <div class="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <app-star-rating [value]="existingReviews[appt.appointmentId].rating" [size]="14"></app-star-rating>
                      </div>
                      @if (existingReviews[appt.appointmentId].comment) {
                        <p class="text-xs text-slate-600">{{ existingReviews[appt.appointmentId].comment }}</p>
                      }
                      <p class="text-xs text-slate-400 mt-1">Submitted on {{ existingReviews[appt.appointmentId].reviewDate | formatDate }}</p>
                    </div>
                    <button (click)="openEditReview(appt)" class="text-xs text-blue-600 hover:underline font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              }
            }
          </div>
        }
      </div>
    </app-sidebar-layout>

    <!-- Cancel Modal — triggers refund automatically -->
    <app-confirm-modal
      [open]="cancelModal"
      title="Cancel Appointment"
      message="This will cancel your appointment. If eligible, a refund will be automatically processed."
      confirmText="Cancel Appointment"
      cancelText="Keep It"
      [danger]="true"
      [requireReason]="true"
      reasonLabel="Reason for cancellation"
      reasonPlaceholder="e.g. Schedule conflict, feeling better…"
      (confirmed)="confirmCancel($event)"
      (cancelled)="cancelModal = false">
    </app-confirm-modal>

    <!-- Review Modal -->
    @if (reviewModal && reviewAppt) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="reviewModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-modal max-w-lg w-full p-6 page-enter max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-serif text-xl text-navy-800">{{ existingReviews[reviewAppt.appointmentId] ? 'Edit' : 'Leave a' }} Review</h3>
            <button (click)="reviewModal = false" class="text-gray-400 hover:text-gray-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <div class="space-y-4">
            <!-- Service info -->
            <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div class="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                <app-icon name="stethoscope" [size]="18" class="text-navy-700"></app-icon>
              </div>
              <div>
                <p class="font-medium text-slate-900">{{ reviewAppt.serviceType }}</p>
                <p class="text-xs text-slate-500">{{ reviewAppt.appointmentDate | formatDate }}</p>
              </div>
            </div>

            <!-- Rating -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">How would you rate this appointment?</label>
              <div class="flex justify-center py-2">
                <app-star-rating 
                  [value]="reviewRating" 
                  [interactive]="true"
                  [size]="32"
                  (valueChange)="reviewRating = $event">
                </app-star-rating>
              </div>
            </div>

            <!-- Comment -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Comments (optional)</label>
              <textarea 
                [(ngModel)]="reviewComment" 
                placeholder="Share your experience with this appointment…"
                class="input-field min-h-[100px] resize-none"></textarea>
              <p class="text-xs text-slate-400 mt-1">{{ reviewComment.length || 0 }}/500 characters</p>
            </div>

            <!-- Anonymous toggle -->
            <div class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="reviewAnonymous" id="anonymous" class="w-4 h-4 rounded cursor-pointer">
              <label for="anonymous" class="text-sm text-slate-600 cursor-pointer">Post this review anonymously</label>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-4">
            <button class="btn-secondary" (click)="reviewModal = false">Cancel</button>
            <button class="btn-primary" [disabled]="reviewRating === 0 || submittingReview" (click)="submitReview()">
              @if (submittingReview) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              {{ submittingReview ? 'Submitting…' : (existingReviews[reviewAppt.appointmentId] ? 'Update Review' : 'Submit Review') }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Reschedule Modal -->
    @if (rescheduleModal && rescheduleAppt) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="rescheduleModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-modal max-w-lg w-full p-6 page-enter max-h-[90vh] overflow-y-auto">
          <h3 class="font-serif text-xl text-navy-800 mb-5">Reschedule Appointment</h3>

          <p class="section-label">Select New Date</p>
          <div class="flex gap-2 overflow-x-auto pb-2 mb-5">
            @for (day of dateStrip; track day.iso) {
              <button (click)="loadRescheduleSlots(day.iso)"
                class="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[56px]"
                [ngClass]="rescheduleDate === day.iso
                  ? 'border-navy-700 bg-navy-700 text-white'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                <span class="text-xs font-medium">{{ day.dayName }}</span>
                <span class="text-base font-bold leading-tight">{{ day.day }}</span>
                <span class="text-xs opacity-70">{{ day.month }}</span>
              </button>
            }
          </div>

          @if (rescheduleDate && rescheduleSlots.length === 0) {
            <p class="text-slate-400 text-sm text-center py-4">No available slots for this date.</p>
          }

          @if (rescheduleSlots.length > 0) {
            <p class="section-label">Select Slot</p>
            <div class="grid grid-cols-3 gap-2 mb-5">
              @for (slot of rescheduleSlots; track slot.slotId) {
                <button (click)="rescheduleSlotId = slot.slotId"
                  class="py-2.5 px-3 rounded-lg text-sm border-2 transition-all"
                  [ngClass]="rescheduleSlotId === slot.slotId
                    ? 'border-navy-700 bg-navy-700 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                  {{ slot.startTime | formatTime }}
                </button>
              }
            </div>
          }

          <div class="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button class="btn-secondary" (click)="rescheduleModal = false">Cancel</button>
            <button class="btn-primary" [disabled]="!rescheduleSlotId || rescheduling" (click)="confirmReschedule()">
              @if (rescheduling) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              }
              {{ rescheduling ? 'Rescheduling…' : 'Confirm Reschedule' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class PatientAppointmentsComponent implements OnInit {
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private paymentService = inject(PaymentService);
  private scheduleService = inject(ScheduleService);
  private reviewService = inject(ReviewService);
  private navigationService = inject(NavigationService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  tab: 'upcoming' | 'past' = 'upcoming';
  upcoming: AppointmentSummary[] = [];
  past: AppointmentSummary[] = [];
  loading = true;
  paymentStatuses: Record<string, string> = {};
  existingReviews: Record<string, ReviewResponse> = {};

  cancelModal = false;
  cancelAppt: AppointmentSummary | null = null;

  rescheduleModal = false;
  rescheduleAppt: AppointmentSummary | null = null;
  rescheduleDate = '';
  rescheduleSlots: SlotSummary[] = [];
  rescheduleSlotId = '';
  rescheduling = false;

  reviewModal = false;
  reviewAppt: AppointmentSummary | null = null;
  reviewRating = 0;
  reviewComment = '';
  reviewAnonymous = false;
  submittingReview = false;

  dateStrip: { iso: string; day: number; month: string; dayName: string }[] = [];

  ngOnInit(): void {
    this.buildDateStrip();
    const userId = this.auth.currentUser()?.userId!;
    this.apptService.getPatientUpcoming(userId).subscribe({
      next: (a) => { this.upcoming = a; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadPast(): void {
    if (this.past.length) return;
    const userId = this.auth.currentUser()?.userId!;
    this.apptService.getPatientAppointments(userId).subscribe({
      next: (all) => {
        this.past = all.filter(a => a.status !== 'SCHEDULED');
        // Fetch payment status and reviews for each past appointment
        this.past.forEach(a => {
          this.paymentService.getStatus(Number(a.appointmentId)).subscribe({
            next: (res) => {
              this.paymentStatuses[a.appointmentId] = res.status;
            },
            error: () => {}
          });
          // Load existing reviews
          if (a.status === 'COMPLETED') {
            this.reviewService.getByAppointment(Number(a.appointmentId)).subscribe({
              next: (review) => {
                this.existingReviews[a.appointmentId] = review;
              },
              error: () => {}
            });
          }
        });
      },
      error: () => { this.toast.error('Failed to load past appointments.'); }
    });
  }

  openCancel(appt: AppointmentSummary): void {
    this.cancelAppt = appt;
    this.cancelModal = true;
  }

  confirmCancel(reason: string): void {
    this.cancelModal = false;
    const appt = this.cancelAppt!;

    // 1. Cancel the appointment
    this.apptService.cancel(appt.appointmentId, reason).subscribe({
      next: () => {
        this.upcoming = this.upcoming.filter(a => a.appointmentId !== appt.appointmentId);
        this.toast.success('Appointment cancelled.');

        // 2. Trigger refund automatically
        this.paymentService.refund(Number(appt.appointmentId), reason).subscribe({
          next: (res) => {
            if (res.status === 'REFUNDED') {
              this.toast.success(`Refund processed. Ref: ${res.refundTransactionId}`);
            } else if (res.notes?.includes('outside')) {
              this.toast.warning('Cancellation outside refund window — no refund issued.');
            } else if (res.notes?.includes('CASH')) {
              this.toast.info('Cash appointment cancelled — no charge was made.');
            }
          },
          error: () => {
            this.toast.warning('Refund could not be processed automatically. Contact support.');
          }
        });
      },
      error: () => this.toast.error('Failed to cancel appointment.')
    });
  }

  openReschedule(appt: AppointmentSummary): void {
    this.rescheduleAppt = appt;
    this.rescheduleModal = true;
    this.rescheduleSlots = [];
    this.rescheduleSlotId = '';
    this.rescheduleDate = '';
  }

  loadRescheduleSlots(date: string): void {
    this.rescheduleDate = date;
    this.scheduleService.getAvailableByDate(this.rescheduleAppt!.providerId, date).subscribe({
      next: (s) => this.rescheduleSlots = s
    });
  }

  confirmReschedule(): void {
    this.rescheduling = true;
    this.apptService.reschedule(this.rescheduleAppt!.appointmentId, this.rescheduleSlotId).subscribe({
      next: () => {
        this.rescheduling = false;
        this.rescheduleModal = false;
        this.toast.success('Appointment rescheduled!');
        // Refresh upcoming list
        const userId = this.auth.currentUser()?.userId!;
        this.apptService.getPatientUpcoming(userId).subscribe(a => this.upcoming = a);
      },
      error: () => { this.rescheduling = false; this.toast.error('Reschedule failed.'); }
    });
  }

  openReviewModal(appt: AppointmentSummary): void {
    this.reviewAppt = appt;
    const existing = this.existingReviews[appt.appointmentId];
    if (existing) {
      this.reviewRating = existing.rating;
      this.reviewComment = existing.comment || '';
      this.reviewAnonymous = existing.isAnonymous;
    } else {
      this.reviewRating = 0;
      this.reviewComment = '';
      this.reviewAnonymous = false;
    }
    this.reviewModal = true;
  }

  openEditReview(appt: AppointmentSummary): void {
    this.openReviewModal(appt);
  }

  submitReview(): void {
    if (!this.reviewAppt || this.reviewRating === 0) return;

    this.submittingReview = true;
    const userId = this.auth.currentUser()?.userId!;
    const existing = this.existingReviews[this.reviewAppt.appointmentId];

    if (existing) {
      // Update existing review
      this.reviewService.updateReview(existing.reviewId, {
        rating: this.reviewRating,
        comment: this.reviewComment || undefined,
        isAnonymous: this.reviewAnonymous
      }).subscribe({
        next: (updated) => {
          this.submittingReview = false;
          this.existingReviews[this.reviewAppt!.appointmentId] = updated;
          this.reviewModal = false;
          this.toast.success('Review updated successfully!');
        },
        error: () => {
          this.submittingReview = false;
          this.toast.error('Failed to update review.');
        }
      });
    } else {
      // Submit new review
      this.reviewService.addReview({
        appointmentId: Number(this.reviewAppt.appointmentId),
        patientId: Number(userId),
        providerId: Number(this.reviewAppt.providerId),
        rating: this.reviewRating,
        comment: this.reviewComment || undefined,
        isAnonymous: this.reviewAnonymous
      }).subscribe({
        next: (review) => {
          this.submittingReview = false;
          this.existingReviews[this.reviewAppt!.appointmentId] = review;
          this.reviewModal = false;
          this.toast.success('Thank you for your review!');
        },
        error: () => {
          this.submittingReview = false;
          this.toast.error('Failed to submit review.');
        }
      });
    }
  }

  buildDateStrip(): void {
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      this.dateStrip.push({
        iso: d.toISOString().split('T')[0],
        day: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        dayName: d.toLocaleString('default', { weekday: 'short' }),
      });
    }
  }
}