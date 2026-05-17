import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { IconComponent } from '../../shared/components/icon.component';
import { StarRatingComponent } from '../../shared/components/star-rating.component';
import { ProviderService } from '../../core/services/provider.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { ReviewService } from '../../core/services/review.service';
import { AuthService } from '../../core/services/auth.service';
import { ProviderResponse, SlotSummary } from '../../core/models';
import { PublicReview, RatingSummary } from '../../core/review.models';
import { FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent, IconComponent,
            StarRatingComponent, FormatTimePipe, FormatDatePipe],
  template: `
    <app-navbar></app-navbar>

    @if (loading) {
      <div class="max-w-4xl mx-auto px-4 py-10">
        <div class="card animate-pulse h-48 mb-6"></div>
        <div class="card animate-pulse h-32"></div>
      </div>
    }

    @if (!loading && !provider) {
      <div class="max-w-4xl mx-auto px-4 py-20 text-center text-gray-400">
        <div class="text-5xl mb-4">🔍</div>
        <p class="text-lg">Provider not found.</p>
        <a routerLink="/providers" class="btn-primary inline-flex mt-6">Back to Directory</a>
      </div>
    }

    @if (!loading && provider) {
      <div class="max-w-4xl mx-auto px-4 py-8 page-enter">

        <!-- Provider header card -->
        <div class="card mb-6">
          <div class="flex flex-col sm:flex-row items-start gap-6">
            <div class="w-24 h-24 rounded-2xl bg-navy-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
              @if (provider.profilePicUrl) {
                <img [src]="provider.profilePicUrl" class="w-full h-full object-cover" alt="">
              } @else {
                <app-icon name="user" sizeClass="w-12 h-12 text-navy-400"></app-icon>
              }
            </div>
            <div class="flex-1">
              <h1 class="text-3xl font-serif text-navy-700 mb-1">Dr. {{ provider.providerName || 'Healthcare Provider' }}</h1>
              <p class="text-lg text-emerald-600 font-medium mb-1">{{ provider.specialization }}</p>
              <p class="text-gray-500 text-sm mb-3">{{ provider.qualification }} · {{ provider.experienceYears }} years experience</p>

              <div class="flex flex-wrap items-center gap-4 text-sm">
                @if (ratingSummary) {
                  <div class="flex items-center gap-1.5">
                    <app-star-rating [value]="ratingSummary.avgRating" [size]="16" [showLabel]="true" [count]="ratingSummary.totalReviews"></app-star-rating>
                  </div>
                }
                @if (provider.consultationFee) {
                  <span class="text-navy-700 font-semibold">₹{{ provider.consultationFee }} / visit</span>
                }
                <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="provider.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                  {{ provider.available ? '● Available' : '○ Busy' }}
                </span>
              </div>

              @if (provider.clinicName) {
                <p class="text-gray-500 text-sm mt-3 flex items-center gap-2">
                  <app-icon name="hospital" sizeClass="w-4 h-4"></app-icon>
                  {{ provider.clinicName }}
                  @if (provider.clinicAddress) { · {{ provider.clinicAddress }} }
                </p>
              }
            </div>
          </div>

          @if (provider.bio) {
            <p class="text-gray-600 text-sm mt-5 pt-5 border-t border-gray-100 leading-relaxed">{{ provider.bio }}</p>
          }
        </div>

        <!-- Booking Section -->
        @if (provider.available && provider.verificationStatus === 'APPROVED') {
          <div class="card mb-6">
            <h2 class="text-xl font-serif text-navy-700 mb-5">Book an Appointment</h2>

            <p class="section-label">Select Date</p>
            <div class="flex gap-2 overflow-x-auto pb-2 mb-5">
              @for (day of dateStrip; track day.iso) {
                <button (click)="loadSlots(day.iso)"
                  class="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[56px]"
                  [ngClass]="selectedDate === day.iso
                    ? 'border-navy-700 bg-navy-700 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-navy-300'">
                  <span class="text-xs font-medium">{{ day.dayName }}</span>
                  <span class="text-base font-bold leading-tight">{{ day.day }}</span>
                  <span class="text-xs opacity-70">{{ day.month }}</span>
                </button>
              }
            </div>

            @if (slotsLoading) {
              <div class="grid grid-cols-4 gap-2">
                @for (i of [1,2,3,4,5,6,7,8]; track i) {
                  <div class="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                }
              </div>
            }

            @if (!slotsLoading && selectedDate && slots.length === 0) {
              <p class="text-gray-400 text-sm text-center py-6">No available slots for this date.</p>
            }

            @if (!slotsLoading && slots.length > 0) {
              <p class="section-label">Select Time Slot</p>
              <div class="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                @for (slot of slots; track slot.slotId) {
                  <button (click)="selectedSlot = slot"
                    class="py-2.5 px-3 rounded-lg text-sm border-2 transition-all text-center"
                    [ngClass]="selectedSlot?.slotId === slot.slotId
                      ? 'border-navy-700 bg-navy-700 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-navy-300'">
                    {{ slot.startTime | formatTime }}
                  </button>
                }
              </div>

              @if (selectedSlot) {
                <div class="bg-navy-50 rounded-xl p-4 mb-5 text-sm">
                  <p class="font-medium text-navy-800 mb-1">Selected Slot</p>
                  <p class="text-navy-600">{{ selectedDate | formatDate }} · {{ selectedSlot.startTime | formatTime }} – {{ selectedSlot.endTime | formatTime }}</p>
                </div>

                <button (click)="proceedToBook()" class="btn-primary w-full py-3">
                  <app-icon name="calendar" sizeClass="w-5 h-5"></app-icon>
                  Continue Booking
                </button>
              }
            }
          </div>
        }

        @if (!provider.available || provider.verificationStatus !== 'APPROVED') {
          <div class="card mb-6 text-center py-8">
            <app-icon name="clock" sizeClass="w-10 h-10 text-gray-300 mx-auto mb-3"></app-icon>
            <p class="text-gray-500">This provider is currently unavailable for booking.</p>
          </div>
        }

        <!-- Reviews -->
        @if (reviews.length > 0) {
          <div class="card">
            <h2 class="text-xl font-serif text-navy-700 mb-5">Patient Reviews</h2>
            <div class="space-y-4">
              @for (review of reviews; track review.reviewId) {
                <div class="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <app-star-rating [value]="review.rating" [size]="15"></app-star-rating>
                      @if (review.isVerified) {
                        <span class="text-xs text-emerald-600 flex items-center gap-1 font-medium">
                          <app-icon name="shield-check" sizeClass="w-3 h-3"></app-icon> Verified
                        </span>
                      }
                    </div>
                    <span class="text-xs text-gray-400">{{ review.reviewDate }}</span>
                  </div>
                  @if (review.comment) {
                    <p class="text-sm text-gray-600 leading-relaxed">{{ review.comment }}</p>
                  }
                  <p class="text-xs text-gray-400 mt-1">{{ review.patientLabel }}</p>
                </div>
              }
            </div>
          </div>
        }

      </div>
    }
  `
})
export class ProviderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private providerService = inject(ProviderService);
  private scheduleService = inject(ScheduleService);
  private reviewService = inject(ReviewService);
  auth = inject(AuthService);

  provider: ProviderResponse | null = null;
  loading = true;
  slots: SlotSummary[] = [];
  slotsLoading = false;
  selectedDate = '';
  selectedSlot: SlotSummary | null = null;
  reviews: PublicReview[] = [];
  ratingSummary: RatingSummary | null = null;
  dateStrip: { iso: string; day: number; month: string; dayName: string }[] = [];

  ngOnInit(): void {
    this.buildDateStrip();
    const id = Number(this.route.snapshot.paramMap.get('id')!);

    this.providerService.getById(id).subscribe({
      next: (p) => {
        this.provider = p;
        this.loading = false;
        // Load reviews
        this.reviewService.getByProvider(id).subscribe({
          next: (r) => this.reviews = r,
          error: () => {}
        });
        this.reviewService.getRatingSummary(id).subscribe({
          next: (s) => this.ratingSummary = s,
          error: () => {}
        });
      },
      error: () => { this.loading = false; }
    });
  }

  loadSlots(date: string): void {
    this.selectedDate = date;
    this.selectedSlot = null;
    this.slotsLoading = true;
    this.scheduleService.getAvailableByDate(this.provider!.providerId, date).subscribe({
      next: (s) => { this.slots = s; this.slotsLoading = false; },
      error: () => { this.slotsLoading = false; }
    });
  }

  proceedToBook(): void {
    if (!this.selectedSlot || !this.provider) return;

    // If not logged in, redirect to login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.auth.role !== 'PATIENT') {
      return;
    }

    this.router.navigate(['/patient/book'], {
      queryParams: {
        providerId: this.provider.providerId,
        slotId: this.selectedSlot.slotId,
        date: this.selectedDate,
        startTime: this.selectedSlot.startTime,
        endTime: this.selectedSlot.endTime,
        fee: this.provider.consultationFee || 0,
      }
    });
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