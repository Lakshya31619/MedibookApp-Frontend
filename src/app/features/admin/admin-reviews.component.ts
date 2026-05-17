import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { StarRatingComponent } from '../../shared/components/star-rating.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal.component';
import { NavigationService } from '../../core/services/navigation.service';
import { ReviewService } from '../../core/services/review.service';
import { ToastService } from '../../core/services/toast.service';
import { ReviewResponse } from '../../core/review.models';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent, IconComponent,
            StarRatingComponent, ConfirmModalComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="mb-8">
          <h1 class="page-title">Review Moderation</h1>
          <p class="page-subtitle">Manage, verify and moderate patient reviews</p>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          <button (click)="tab = 'flagged'" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'flagged' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500'">
            <span class="flex items-center gap-2">
              Flagged
              @if (flagged.length > 0) {
                <span class="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {{ flagged.length }}
                </span>
              }
            </span>
          </button>
          <button (click)="tab = 'all'; loadAll()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'all' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500'">
            All Reviews
          </button>
        </div>

        <!-- Search (all tab only) -->
        @if (tab === 'all') {
          <div class="flex gap-3 mb-4">
            <input type="text" [(ngModel)]="searchTerm" (input)="applyFilter()"
                   placeholder="Filter by provider ID or rating…"
                   class="input-field max-w-xs">
            <select [(ngModel)]="ratingFilter" (change)="applyFilter()" class="input-field w-40">
              <option value="">All Ratings</option>
              @for (r of [5,4,3,2,1]; track r) {
                <option [value]="r">{{ r }} star{{ r > 1 ? 's' : '' }}</option>
              }
            </select>
            <span class="text-xs text-slate-400 self-center ml-auto">{{ filtered.length }} reviews</span>
          </div>
        }

        <!-- Flagged tab -->
        @if (tab === 'flagged') {
          @if (flaggedLoading) {
            <div class="space-y-3">
              @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-28"></div> }
            </div>
          }
          @if (!flaggedLoading && flagged.length === 0) {
            <div class="card text-center py-14">
              <div class="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <app-icon name="shield-check" [size]="22" class="text-emerald-600"></app-icon>
              </div>
              <p class="font-medium text-slate-600">No flagged reviews</p>
              <p class="text-slate-400 text-sm mt-1">Everything looks clean!</p>
            </div>
          }
          <div class="space-y-3">
            @for (review of flagged; track review.reviewId) {
              <ng-container *ngTemplateOutlet="reviewCard; context: { $implicit: review }"></ng-container>
            }
          </div>
        }

        <!-- All reviews tab -->
        @if (tab === 'all') {
          @if (allLoading) {
            <div class="space-y-3">
              @for (i of [1,2,3,4]; track i) { <div class="card animate-pulse h-24"></div> }
            </div>
          }
          @if (!allLoading && filtered.length === 0) {
            <div class="card text-center py-14">
              <p class="text-slate-400">No reviews found.</p>
            </div>
          }
          <div class="space-y-3">
            @for (review of filtered; track review.reviewId) {
              <ng-container *ngTemplateOutlet="reviewCard; context: { $implicit: review }"></ng-container>
            }
          </div>
        }

      </div>
    </app-sidebar-layout>

    <!-- Review card template -->
    <ng-template #reviewCard let-review>
      <div class="card"
           [ngClass]="review.isFlagged ? 'border-red-200 bg-red-50/30' : ''">
        <div class="flex flex-col gap-3">
          <!-- Header row -->
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <div class="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center
                          text-navy-700 text-xs font-semibold flex-shrink-0">
                P{{ review.patientId }}
              </div>
              <div>
                <div class="flex items-center gap-2 mb-0.5">
                  <app-star-rating [value]="review.rating" [size]="14"></app-star-rating>
                  @if (review.isVerified) {
                    <span class="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <app-icon name="shield-check" [size]="11"></app-icon> Verified
                    </span>
                  }
                  @if (review.isFlagged) {
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                      <app-icon name="alert-circle" [size]="11"></app-icon> Flagged
                    </span>
                  }
                  @if (review.isAnonymous) {
                    <span class="text-xs text-slate-400">Anonymous</span>
                  }
                </div>
                <p class="text-xs text-slate-500">
                  Provider #{{ review.providerId }} · Appt #{{ review.appointmentId }} · {{ review.reviewDate }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 flex-shrink-0">
              @if (!review.isVerified) {
                <button (click)="verifyReview(review)"
                        class="btn-primary text-xs py-1.5 px-3">
                  <app-icon name="shield-check" [size]="13"></app-icon> Verify
                </button>
              }
              @if (review.isFlagged) {
                <button (click)="unflagReview(review)"
                        class="btn-secondary text-xs py-1.5 px-3">
                  Unflag
                </button>
              }
              <button (click)="openDelete(review)"
                      class="btn-danger text-xs py-1.5 px-3">
                <app-icon name="trash" [size]="13"></app-icon>
              </button>
            </div>
          </div>

          @if (review.comment) {
            <p class="text-sm text-slate-700 leading-relaxed ml-12">{{ review.comment }}</p>
          }

          @if (review.isFlagged && review.flagReason) {
            <div class="ml-12 text-xs bg-red-100 text-red-700 rounded-lg px-3 py-2 border border-red-200">
              <span class="font-semibold">Flag reason:</span> {{ review.flagReason }}
            </div>
          }
        </div>
      </div>
    </ng-template>

    <!-- Delete confirm modal -->
    <app-confirm-modal
      [open]="deleteModal"
      title="Delete Review"
      message="This will permanently delete the review and recompute the provider's rating."
      confirmText="Delete Review"
      cancelText="Cancel"
      [danger]="true"
      (confirmed)="confirmDelete()"
      (cancelled)="deleteModal = false">
    </app-confirm-modal>
  `
})
export class AdminReviewsComponent implements OnInit {
  private navigationService = inject(NavigationService);
  private reviewSvc = inject(ReviewService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  tab: 'flagged' | 'all' = 'flagged';

  flagged: ReviewResponse[] = [];
  flaggedLoading = true;

  all: ReviewResponse[] = [];
  filtered: ReviewResponse[] = [];
  allLoading = false;
  searchTerm = '';
  ratingFilter: number | '' = '';

  deleteModal = false;
  deleteTarget: ReviewResponse | null = null;

  ngOnInit(): void {
    this.reviewSvc.getFlagged().subscribe({
      next: (r) => { this.flagged = r; this.flaggedLoading = false; },
      error: () => { this.flaggedLoading = false; }
    });
  }

  loadAll(): void {
    if (this.all.length) return;
    this.allLoading = true;
    this.reviewSvc.getAll().subscribe({
      next: (r) => { this.all = r; this.filtered = r; this.allLoading = false; },
      error: () => { this.allLoading = false; }
    });
  }

  applyFilter(): void {
    const term = this.searchTerm.toLowerCase();
    this.filtered = this.all.filter(r => {
      const matchRating = !this.ratingFilter || r.rating === Number(this.ratingFilter);
      const matchSearch = !term
        || String(r.providerId).includes(term)
        || String(r.patientId).includes(term)
        || (r.comment || '').toLowerCase().includes(term);
      return matchRating && matchSearch;
    });
  }

  private refreshReviews(): void {
    // Refresh flagged reviews
    this.reviewSvc.getFlagged().subscribe({
      next: (r) => { this.flagged = r; },
      error: (err) => { console.error('Error refreshing flagged reviews:', err); }
    });
    // Refresh all reviews if already loaded
    if (this.all.length > 0) {
      this.reviewSvc.getAll().subscribe({
        next: (r) => { 
          this.all = r; 
          this.applyFilter(); 
        },
        error: (err) => { console.error('Error refreshing all reviews:', err); }
      });
    }
  }

  verifyReview(review: ReviewResponse): void {
    this.reviewSvc.verifyReview(review.reviewId).subscribe({
      next: () => {
        this.patchReview(review.reviewId, { isVerified: true, isFlagged: false });
        this.flagged = this.flagged.filter(r => r.reviewId !== review.reviewId);
        this.toast.success('Review verified.');
      },
      error: (err) => {
        console.error('Error verifying review:', err);
        this.toast.error('Failed to verify review. Please try again.');
        // Try to refresh after a delay to ensure backend changes are persisted
        setTimeout(() => this.refreshReviews(), 500);
      }
    });
  }

  unflagReview(review: ReviewResponse): void {
    this.reviewSvc.unflagReview(review.reviewId).subscribe({
      next: () => {
        this.patchReview(review.reviewId, { isFlagged: false, flagReason: null });
        this.flagged = this.flagged.filter(r => r.reviewId !== review.reviewId);
        this.toast.info('Review unflagged.');
      },
      error: (err) => {
        console.error('Error unflagging review:', err);
        this.toast.error('Failed to unflag review. Please try again.');
        // Try to refresh after a delay to ensure backend changes are persisted
        setTimeout(() => this.refreshReviews(), 500);
      }
    });
  }

  openDelete(review: ReviewResponse): void { this.deleteTarget = review; this.deleteModal = true; }

  confirmDelete(): void {
    this.deleteModal = false;
    const review = this.deleteTarget!;
    this.reviewSvc.deleteReview(review.reviewId).subscribe({
      next: () => {
        this.flagged = this.flagged.filter(r => r.reviewId !== review.reviewId);
        this.all     = this.all.filter(r => r.reviewId !== review.reviewId);
        this.applyFilter();
        this.toast.success('Review deleted and provider rating updated.');
      },
      error: (err) => {
        console.error('Error deleting review:', err);
        this.toast.error('Failed to delete review. Refreshing to check status...');
        // Always refresh after delete error to ensure UI is in sync
        setTimeout(() => this.refreshReviews(), 500);
      }
    });
  }

  private patchReview(id: number, patch: Partial<ReviewResponse>): void {
    const update = (list: ReviewResponse[]) => {
      const idx = list.findIndex(r => r.reviewId === id);
      if (idx !== -1) list[idx] = { ...list[idx], ...patch };
    };
    update(this.flagged);
    update(this.all);
    this.applyFilter();
  }
}