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
import { PaymentResponse, RazorpayHandlerResponse, RazorpayOrderResponse } from '../../core/payment.models';
import { StatusBadgePipe, FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

// Razorpay is loaded globally via checkout.js in index.html
declare const Razorpay: any;

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
          <button (click)="tab = 'upcoming'" class="px-5 py-2 rounded-lg text-sm font-medium transition-all relative"
            [ngClass]="tab === 'upcoming' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Upcoming ({{ upcoming.length }})
            @if (unpaidCount > 0) {
              <span class="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                {{ unpaidCount }}
              </span>
            }
          </button>
          <button (click)="tab = 'past'; loadPast()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'past' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Past ({{ past.length }})
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
              <div class="card" [ngClass]="paymentStatuses[appt.appointmentId] === 'PENDING' ? 'border-l-4 border-l-amber-400' : ''">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-navy-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon [name]="appt.modeOfConsultation === 'VIDEO' ? 'video' : 'stethoscope'"
                                [size]="18" class="text-navy-600"></app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span [ngClass]="appt.status | statusBadge">{{ getStatusLabel(appt.status) }}</span>
                        <!-- Payment status badge -->
                        @if (paymentStatuses[appt.appointmentId]) {
                          <span class="text-xs font-medium px-2 py-0.5 rounded-full border"
                                [ngClass]="paymentStatuses[appt.appointmentId] === 'PAID'
                                           ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                           : paymentStatuses[appt.appointmentId] === 'PENDING'
                                           ? 'bg-amber-50 text-amber-700 border-amber-200'
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

                  <div class="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                    <!-- Pay Now button — shown when payment is PENDING -->
                    @if (paymentStatuses[appt.appointmentId] === 'PENDING') {
                      <button (click)="openPayNow(appt)"
                              [disabled]="payingAppointmentId === appt.appointmentId"
                              class="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60">
                        @if (payingAppointmentId === appt.appointmentId) {
                          <span class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Processing…
                        } @else {
                          <app-icon name="credit-card" [size]="13"></app-icon>
                          Pay Now
                        }
                      </button>
                    }
                    @if (appt.status === 'SCHEDULED') {
                      <button (click)="openReschedule(appt)" class="btn-secondary text-xs py-1.5 px-3">
                        <app-icon name="refresh-cw" [size]="13"></app-icon>
                        Reschedule
                      </button>
                      <button (click)="openCancel(appt)" class="btn-danger text-xs py-1.5 px-3">
                        <app-icon name="x" [size]="13"></app-icon>
                        Cancel
                      </button>
                    }
                  </div>
                </div>

                <!-- Unpaid warning banner -->
                @if (paymentStatuses[appt.appointmentId] === 'PENDING') {
                  <div class="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <app-icon name="alert-triangle" [size]="14" class="text-amber-600 mt-0.5 flex-shrink-0"></app-icon>
                    <p class="text-xs text-amber-800">
                      Payment is pending. Please complete payment to confirm your booking.
                    </p>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Past -->
        @if (tab === 'past') {
          <!-- Status filter pills -->
          @if (!loading && past.length > 0) {
            <div class="flex flex-wrap gap-2 mb-5">
              @for (f of statusFilters; track f.value) {
                <button
                  (click)="pastFilter = f.value"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  [ngClass]="pastFilter === f.value
                    ? f.activeClass
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'">
                  <span class="w-1.5 h-1.5 rounded-full" [ngClass]="pastFilter === f.value ? f.dotActive : f.dot"></span>
                  {{ f.label }}
                  <span class="opacity-70">({{ countByStatus(f.value) }})</span>
                </button>
              }
            </div>
          }

          @if (!loading && filteredPast.length === 0) {
            <div class="card text-center py-14">
              <p class="text-slate-400">{{ past.length === 0 ? 'No past appointments found.' : 'No ' + pastFilter.toLowerCase() + ' appointments.' }}</p>
            </div>
          }
          @if (!loading) {
          <div class="space-y-3">
            @for (appt of filteredPast; track appt.appointmentId) {
              <div class="card">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon name="clipboard" [size]="18" class="text-slate-500"></app-icon>
                    </div>
                    <div>
                      <div class="flex items-center gap-2 mb-0.5">
                        <span [ngClass]="appt.status | statusBadge">{{ getStatusLabel(appt.status) }}</span>
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
        }
      </div>
    </app-sidebar-layout>

    <!-- Cancel Modal -->
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
            <div class="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div class="w-10 h-10 bg-navy-100 rounded-full flex items-center justify-center flex-shrink-0">
                <app-icon name="stethoscope" [size]="18" class="text-navy-700"></app-icon>
              </div>
              <div>
                <p class="font-medium text-slate-900">{{ reviewAppt.serviceType }}</p>
                <p class="text-xs text-slate-500">{{ reviewAppt.appointmentDate | formatDate }}</p>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">How would you rate this appointment?</label>
              <div class="flex justify-center py-2">
                <app-star-rating [value]="reviewRating" [interactive]="true" [size]="32" (valueChange)="reviewRating = $event"></app-star-rating>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Comments (optional)</label>
              <textarea [(ngModel)]="reviewComment" placeholder="Share your experience…" class="input-field min-h-[100px] resize-none"></textarea>
              <p class="text-xs text-slate-400 mt-1">{{ reviewComment.length || 0 }}/500 characters</p>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" [(ngModel)]="reviewAnonymous" id="anonymous" class="w-4 h-4 rounded cursor-pointer">
              <label for="anonymous" class="text-sm text-slate-600 cursor-pointer">Post this review anonymously</label>
            </div>
          </div>
          <div class="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-4">
            <button class="btn-secondary" (click)="reviewModal = false">Cancel</button>
            <button class="btn-primary" [disabled]="reviewRating === 0 || submittingReview" (click)="submitReview()">
              @if (submittingReview) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
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
                [ngClass]="rescheduleDate === day.iso ? 'border-navy-700 bg-navy-700 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'">
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
                  [ngClass]="rescheduleSlotId === slot.slotId ? 'border-navy-700 bg-navy-700 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                  {{ slot.startTime | formatTime }}
                </button>
              }
            </div>
          }
          <div class="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <button class="btn-secondary" (click)="rescheduleModal = false">Cancel</button>
            <button class="btn-primary" [disabled]="!rescheduleSlotId || rescheduling" (click)="confirmReschedule()">
              @if (rescheduling) { <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> }
              {{ rescheduling ? 'Rescheduling…' : 'Confirm Reschedule' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Pay Now Modal -->
    @if (payNowModal && payNowAppt) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" (click)="payNowModal = false"></div>
        <div class="relative bg-white rounded-xl shadow-modal max-w-md w-full p-6 page-enter">
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-serif text-xl text-navy-800">Complete Payment</h3>
            <button (click)="payNowModal = false" class="text-gray-400 hover:text-gray-600">
              <app-icon name="x" [size]="20"></app-icon>
            </button>
          </div>

          <!-- Appointment summary card -->
          <div class="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-navy-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <app-icon [name]="payNowAppt.modeOfConsultation === 'VIDEO' ? 'video' : 'stethoscope'"
                          [size]="18" class="text-navy-700"></app-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 text-sm truncate">{{ payNowAppt.serviceType }}</p>
                <p class="text-xs text-slate-500">
                  {{ payNowAppt.appointmentDate | formatDate }} · {{ payNowAppt.startTime | formatTime }}
                </p>
              </div>
            </div>
            @if (payNowPaymentDetail) {
              <div class="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span class="text-sm text-slate-600">Amount Due</span>
                <span class="text-lg font-bold text-slate-900">₹{{ payNowPaymentDetail.amount }}</span>
              </div>
            } @else {
              <div class="mt-3 pt-3 border-t border-slate-200">
                <div class="h-5 bg-slate-200 rounded animate-pulse w-32 ml-auto"></div>
              </div>
            }
          </div>

          <div class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
            <app-icon name="alert-triangle" [size]="14" class="text-amber-600 mt-0.5 flex-shrink-0"></app-icon>
            <p class="text-xs text-amber-800">Your appointment slot is reserved. Complete payment now to confirm your booking.</p>
          </div>

          <div class="flex gap-3">
            <button class="btn-secondary flex-1" (click)="payNowModal = false">Pay Later</button>
            <button class="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm
                           bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-60"
                    [disabled]="loadingPaymentDetail"
                    (click)="proceedPayNow()">
              @if (loadingPaymentDetail) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Loading…
              } @else {
                <app-icon name="credit-card" [size]="15"></app-icon>
                Pay ₹{{ payNowPaymentDetail?.amount ?? '' }}
              }
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
  pastLoaded = false;
  pastFilter: string = 'ALL';

  readonly statusFilters = [
    {
      value: 'ALL',
      label: 'All',
      dot: 'bg-slate-300',
      dotActive: 'bg-white',
      activeClass: 'bg-slate-700 text-white border-slate-700',
    },
    {
      value: 'COMPLETED',
      label: 'Completed',
      dot: 'bg-emerald-400',
      dotActive: 'bg-white',
      activeClass: 'bg-emerald-600 text-white border-emerald-600',
    },
    {
      value: 'CANCELLED',
      label: 'Cancelled',
      dot: 'bg-red-400',
      dotActive: 'bg-white',
      activeClass: 'bg-red-500 text-white border-red-500',
    },
    {
      value: 'NO_SHOW',
      label: 'No-Show',
      dot: 'bg-amber-400',
      dotActive: 'bg-white',
      activeClass: 'bg-amber-500 text-white border-amber-500',
    },
  ];

  get filteredPast(): AppointmentSummary[] {
    if (this.pastFilter === 'ALL') return this.past;
    return this.past.filter(a => a.status === this.pastFilter);
  }

  countByStatus(status: string): number {
    if (status === 'ALL') return this.past.length;
    return this.past.filter(a => a.status === status).length;
  }
  paymentStatuses: Record<string, string> = {};
  existingReviews: Record<string, ReviewResponse> = {};

  get unpaidCount(): number {
    return this.upcoming.filter(a => this.paymentStatuses[a.appointmentId] === 'PENDING').length;
  }

  // Cancel
  cancelModal = false;
  cancelAppt: AppointmentSummary | null = null;

  // Reschedule
  rescheduleModal = false;
  rescheduleAppt: AppointmentSummary | null = null;
  rescheduleDate = '';
  rescheduleSlots: SlotSummary[] = [];
  rescheduleSlotId: number | null = null;
  rescheduling = false;

  // Reviews
  reviewModal = false;
  reviewAppt: AppointmentSummary | null = null;
  reviewRating = 0;
  reviewComment = '';
  reviewAnonymous = false;
  submittingReview = false;

  // Pay Now
  payNowModal = false;
  payNowAppt: AppointmentSummary | null = null;
  payNowPaymentDetail: PaymentResponse | null = null;
  loadingPaymentDetail = false;
  payingAppointmentId: number | null = null;

  dateStrip: { iso: string; day: number; month: string; dayName: string }[] = [];

  ngOnInit(): void {
    this.buildDateStrip();
    const userId = this.auth.currentUser()?.userId!;
    
    // Load ALL appointments at once (both upcoming and past) so accurate count displays from start
    this.apptService.getPatientAppointments(userId).subscribe({
      next: (all) => {
        const now = new Date();
        
        // Separate into upcoming (future scheduled) and past (past date or terminal status)
        this.upcoming = all.filter(a => {
          const apptDate = new Date(a.appointmentDate);
          return apptDate >= now && a.status === 'SCHEDULED';
        });
        
        this.past = all.filter(a => {
          const apptDate = new Date(a.appointmentDate);
          return apptDate < now || a.status === 'CANCELLED' || a.status === 'COMPLETED' || a.status === 'NO_SHOW';
        });
        
        this.pastLoaded = true;
        this.loading = false;
        
        // Fetch payment status and reviews for all appointments
        all.forEach(appt => {
          this.paymentService.getStatus(Number(appt.appointmentId)).subscribe({
            next: (res) => {
              this.paymentStatuses[appt.appointmentId] = res.status === 'NOT_FOUND' ? 'PENDING' : res.status;
            },
            error: () => { this.paymentStatuses[appt.appointmentId] = 'PENDING'; }
          });
          
          if (appt.status === 'COMPLETED') {
            this.reviewService.getByAppointment(Number(appt.appointmentId)).subscribe({
              next: (review) => { this.existingReviews[appt.appointmentId] = review; },
              error: () => {}
            });
          }
        });
      },
      error: () => { this.loading = false; }
    });
  }

  loadPast(): void {
    // Already loaded in ngOnInit, so nothing to do
    return;
  }

  // ─── Cancel ───────────────────────────────────────────────────────────────────

  openCancel(appt: AppointmentSummary): void {
    this.cancelAppt = appt;
    this.cancelModal = true;
  }

  confirmCancel(reason: string): void {
    this.cancelModal = false;
    const appt = this.cancelAppt!;
    this.apptService.cancel(appt.appointmentId, reason).subscribe({
      next: () => {
        this.upcoming = this.upcoming.filter(a => a.appointmentId !== appt.appointmentId);
        this.toast.success('Appointment cancelled.');
        // Only trigger refund if payment was already PAID
        if (this.paymentStatuses[appt.appointmentId] === 'PAID') {
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
        }
      },
      error: () => this.toast.error('Failed to cancel appointment.')
    });
  }

  // ─── Pay Now ──────────────────────────────────────────────────────────────────

  openPayNow(appt: AppointmentSummary): void {
    this.payNowAppt = appt;
    this.payNowPaymentDetail = null;
    this.loadingPaymentDetail = true;
    this.payNowModal = true;
    this.paymentService.getByAppointment(Number(appt.appointmentId)).subscribe({
      next: (p) => {
        this.payNowPaymentDetail = p;
        this.loadingPaymentDetail = false;
      },
      error: () => {
        // Payment record may not exist yet for legacy appointments —
        // proceed anyway; proceedPayNow will fetch amount from createOrder response
        this.loadingPaymentDetail = false;
      }
    });
  }

  proceedPayNow(): void {
    if (!this.payNowAppt) return;
    const appt = this.payNowAppt;
    const patientId = this.auth.currentUser()!.userId;
    const providerId = Number(appt.providerId);

    // If payment detail already loaded, proceed immediately
    if (this.payNowPaymentDetail) {
      this._launchRazorpayOrder(appt, patientId, providerId, this.payNowPaymentDetail.amount);
      return;
    }

    // Payment detail still loading — fetch it now then proceed
    this.loadingPaymentDetail = true;
    this.paymentService.getByAppointment(Number(appt.appointmentId)).subscribe({
      next: (p) => {
        this.payNowPaymentDetail = p;
        this.loadingPaymentDetail = false;
        this._launchRazorpayOrder(appt, patientId, providerId, p.amount);
      },
      error: () => {
        this.loadingPaymentDetail = false;
        this.toast.error('Could not load payment details. Please try again.');
      }
    });
  }

  private _launchRazorpayOrder(
    appt: AppointmentSummary,
    patientId: number,
    providerId: number,
    amount: number
  ): void {
    this.payNowModal = false;
    this.payingAppointmentId = appt.appointmentId;

    this.paymentService.createRazorpayOrder({
      appointmentId: Number(appt.appointmentId),
      patientId,
      providerId,
      amount,
      notes: `Retry payment for appointment on ${appt.appointmentDate}`,
    }).subscribe({
      next: (order) => {
        this.openRazorpayCheckout(order, Number(appt.appointmentId), patientId, providerId, amount, appt.appointmentDate);
      },
      error: (err) => {
        this.payingAppointmentId = null;
        this.toast.error(err.error?.error || 'Could not initiate payment. Please try again.');
      }
    });
  }

  private openRazorpayCheckout(
    order: RazorpayOrderResponse,
    appointmentId: number,
    patientId: number,
    providerId: number,
    amount: number,
    date: string
  ): void {
    const options = {
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      name: 'MediBook',
      description: `Consultation fee — Appointment #${appointmentId}`,
      order_id: order.orderId,
      handler: (response: RazorpayHandlerResponse) => {
        this.paymentService.verifyRazorpayPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          appointmentId,
          patientId,
          providerId,
          amount,
          mode: 'UPI',
          notes: `Retry payment for appointment on ${date}`,
        }).subscribe({
          next: () => {
            this.payingAppointmentId = null;
            this.paymentStatuses[String(appointmentId)] = 'PAID';
            this.toast.success('Payment successful! Your appointment is confirmed.');
          },
          error: (err) => {
            this.payingAppointmentId = null;
            this.toast.error(
              err.error?.error ||
              'Payment could not be verified. Contact support with payment ID: ' +
              response.razorpay_payment_id
            );
          }
        });
      },
      modal: {
        ondismiss: () => {
          this.payingAppointmentId = null;
          this.toast.warning('Payment cancelled. Your appointment is still pending payment.');
        }
      },
      theme: { color: '#1e3a5f' },
    };
    const rzp = new Razorpay(options);
    rzp.open();
  }

  // ─── Reschedule ───────────────────────────────────────────────────────────────

  openReschedule(appt: AppointmentSummary): void {
    this.rescheduleAppt = appt;
    this.rescheduleModal = true;
    this.rescheduleSlots = [];
    this.rescheduleSlotId = null;
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
    this.apptService.reschedule(this.rescheduleAppt!.appointmentId, this.rescheduleSlotId!).subscribe({
      next: () => {
        this.rescheduling = false;
        this.rescheduleModal = false;
        this.toast.success('Appointment rescheduled!');
        const userId = this.auth.currentUser()?.userId!;
        this.apptService.getPatientUpcoming(userId).subscribe(a => this.upcoming = a);
      },
      error: () => { this.rescheduling = false; this.toast.error('Reschedule failed.'); }
    });
  }

  // ─── Reviews ─────────────────────────────────────────────────────────────────

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

  openEditReview(appt: AppointmentSummary): void { this.openReviewModal(appt); }

  submitReview(): void {
    if (!this.reviewAppt || this.reviewRating === 0) return;
    this.submittingReview = true;
    const userId = this.auth.currentUser()?.userId!;
    const existing = this.existingReviews[this.reviewAppt.appointmentId];
    const reviewApptId = this.reviewAppt.appointmentId;
    
    if (existing) {
      this.reviewService.updateReview(existing.reviewId, {
        rating: this.reviewRating,
        comment: this.reviewComment || undefined,
        isAnonymous: this.reviewAnonymous
      }).subscribe({
        next: (updated) => {
          try {
            this.existingReviews[reviewApptId] = updated;
            // Small delay to ensure backend cache is invalidated
            setTimeout(() => this.refreshReviewForAppointment(reviewApptId), 500);
            this.toast.success('Review updated successfully!');
          } catch (e) {
            console.error('Error updating review in UI:', e);
          }
        },
        error: (err) => { 
          console.error('Update review error:', err);
          this.toast.error('Failed to update review. Refreshing to sync with server...');
          // Always refresh after error to ensure UI is in sync
          setTimeout(() => this.refreshReviewForAppointment(reviewApptId), 500);
        },
        complete: () => {
          this.submittingReview = false;
          this.resetReviewForm();
          this.reviewModal = false;
        }
      });
    } else {
      this.reviewService.addReview({
        appointmentId: Number(this.reviewAppt.appointmentId),
        patientId: Number(userId),
        providerId: Number(this.reviewAppt.providerId),
        rating: this.reviewRating,
        comment: this.reviewComment || undefined,
        isAnonymous: this.reviewAnonymous
      }).subscribe({
        next: (review) => {
          try {
            this.existingReviews[reviewApptId] = review;
            // Small delay to ensure backend cache is invalidated
            setTimeout(() => this.refreshReviewForAppointment(reviewApptId), 500);
            this.toast.success('Thank you for your review!');
          } catch (e) {
            console.error('Error adding review to UI:', e);
          }
        },
        error: (err) => { 
          console.error('Add review error:', err);
          this.toast.error('Failed to submit review. Refreshing to sync with server...');
          // Always refresh after error to ensure UI is in sync
          setTimeout(() => this.refreshReviewForAppointment(reviewApptId), 500);
        },
        complete: () => {
          this.submittingReview = false;
          this.resetReviewForm();
          this.reviewModal = false;
        }
      });
    }
  }

  private resetReviewForm(): void {
    this.reviewRating = 0;
    this.reviewComment = '';
    this.reviewAnonymous = false;
    this.reviewAppt = null;
  }

  /**
   * Fetch review for appointment and update cache.
   * Called after submitting/updating a review to ensure UI is fresh.
   */
  private refreshReviewForAppointment(appointmentId: number): void {
    this.reviewService.getByAppointment(appointmentId).subscribe({
      next: (review) => {
        this.existingReviews[appointmentId] = review;
      },
      error: (err) => {
        console.error('Failed to refresh review:', err);
      }
    });
  }

  /**
   * Get readable display label for appointment status.
   * Maps NO_SHOW to "Missed" for better UX.
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SCHEDULED': 'Scheduled',
      'COMPLETED': 'Completed',
      'CANCELLED': 'Cancelled',
      'NO_SHOW': 'Missed',
    };
    return labels[status] || status;
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