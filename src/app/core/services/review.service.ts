import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddReviewRequest, UpdateReviewRequest, FlagReviewRequest,
  ReviewResponse, PublicReview, RatingSummary
} from '../review.models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private base = environment.reviewServiceUrl;   // http://localhost:8086

  constructor(private http: HttpClient) {}

  // ── Public (no auth required) ──────────────────────────────────────────────

  /** All public reviews for a provider — shown on provider detail page */
  getByProvider(providerId: string | number): Observable<PublicReview[]> {
    return this.http.get<PublicReview[]>(`${this.base}/reviews/provider/${providerId}`);
  }

  /** Quick avgRating + totalReviews for a provider */
  getAvgRating(providerId: string | number): Observable<{ providerId: number; avgRating: number; totalReviews: number }> {
    return this.http.get<{ providerId: number; avgRating: number; totalReviews: number }>(
      `${this.base}/reviews/rating/${providerId}`
    );
  }

  /** Full rating summary with star distribution */
  getRatingSummary(providerId: string | number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.base}/reviews/summary/${providerId}`);
  }

  // ── Patient ────────────────────────────────────────────────────────────────

  /** Submit a review after a completed appointment */
  addReview(body: AddReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.base}/reviews`, body);
  }

  /** Get the review for a specific appointment (used to pre-fill edit form) */
  getByAppointment(appointmentId: number): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.base}/reviews/appointment/${appointmentId}`);
  }

  /** Get all reviews submitted by a patient */
  getByPatient(patientId: string | number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/reviews/patient/${patientId}`);
  }

  /** Edit an existing review (resets verified status) */
  updateReview(reviewId: number, body: UpdateReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.base}/reviews/${reviewId}`, body);
  }

  // ── Provider ───────────────────────────────────────────────────────────────

  /** Flag a suspicious/abusive review */
  flagReview(reviewId: number, flagReason: string): Observable<{ message: string; reviewId: number }> {
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/reviews/${reviewId}/flag`, { flagReason } satisfies FlagReviewRequest
    );
  }

  /** Remove flag from a review */
  unflagReview(reviewId: number): Observable<{ message: string; reviewId: number }> {
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/reviews/${reviewId}/unflag`, null
    );
  }

  /** Mark a review as verified */
  verifyReview(reviewId: number): Observable<{ message: string; reviewId: number }> {
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/reviews/${reviewId}/verify`, null
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** Get all reviews on the platform */
  getAll(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/reviews/all`);
  }

  /** Get all flagged reviews (moderation queue) */
  getFlagged(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/reviews/flagged`);
  }

  /** Hard-delete a review (also re-computes provider avgRating) */
  deleteReview(reviewId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/reviews/admin/${reviewId}`);
  }
}