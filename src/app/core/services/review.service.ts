import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  AddReviewRequest, UpdateReviewRequest, FlagReviewRequest,
  ReviewResponse, PublicReview, RatingSummary
} from '../review.models';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private base = `${environment.apiUrl}/api/reviews`;
  private reviewCache$ = new Map<string, Observable<ReviewResponse>>();
  private reviewListCache$ = new Map<string, Observable<any[]>>();
  private ratingSummaryCache$ = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {}

  // ── Public ──────────────────────────────────────────────────────────────────

  getByProvider(providerId: string | number): Observable<PublicReview[]> {
    const key = `prov:${providerId}`;
    if (!this.reviewListCache$.has(key)) {
      this.reviewListCache$.set(
        key,
        this.http.get<PublicReview[]>(`${this.base}/provider/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.reviewListCache$.get(key)!;
  }

  getAvgRating(providerId: string | number): Observable<{ providerId: number; avgRating: number; totalReviews: number }> {
    const key = `rating:${providerId}`;
    if (!this.ratingSummaryCache$.has(key)) {
      this.ratingSummaryCache$.set(
        key,
        this.http.get<{ providerId: number; avgRating: number; totalReviews: number }>(
          `${this.base}/rating/${providerId}`
        ).pipe(shareReplay(1))
      );
    }
    return this.ratingSummaryCache$.get(key)!;
  }

  getRatingSummary(providerId: string | number): Observable<RatingSummary> {
    const key = `summary:${providerId}`;
    if (!this.ratingSummaryCache$.has(key)) {
      this.ratingSummaryCache$.set(
        key,
        this.http.get<RatingSummary>(`${this.base}/summary/${providerId}`).pipe(shareReplay(1))
      );
    }
    return this.ratingSummaryCache$.get(key)!;
  }

  // ── Patient ────────────────────────────────────────────────────────────────

  addReview(body: AddReviewRequest): Observable<ReviewResponse> {
    this.clearCache();
    return this.http.post<ReviewResponse>(`${this.base}`, body);
  }

  getByAppointment(appointmentId: number): Observable<ReviewResponse> {
    const key = `apt:${appointmentId}`;
    if (!this.reviewCache$.has(key)) {
      this.reviewCache$.set(
        key,
        this.http.get<ReviewResponse>(`${this.base}/appointment/${appointmentId}`).pipe(shareReplay(1))
      );
    }
    return this.reviewCache$.get(key)!;
  }

  getByPatient(patientId: string | number): Observable<ReviewResponse[]> {
    const key = `pat:${patientId}`;
    if (!this.reviewListCache$.has(key)) {
      this.reviewListCache$.set(
        key,
        this.http.get<ReviewResponse[]>(`${this.base}/patient/${patientId}`).pipe(shareReplay(1))
      );
    }
    return this.reviewListCache$.get(key)!;
  }

  updateReview(reviewId: number, body: UpdateReviewRequest): Observable<ReviewResponse> {
    this.clearCache();
    return this.http.put<ReviewResponse>(`${this.base}/${reviewId}`, body);
  }

  // ── Provider ───────────────────────────────────────────────────────────────

  flagReview(reviewId: number, flagReason: string): Observable<{ message: string; reviewId: number }> {
    this.clearCache();
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/${reviewId}/flag`, { flagReason } satisfies FlagReviewRequest
    );
  }

  unflagReview(reviewId: number): Observable<{ message: string; reviewId: number }> {
    this.clearCache();
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/${reviewId}/unflag`, null
    );
  }

  verifyReview(reviewId: number): Observable<{ message: string; reviewId: number }> {
    this.clearCache();
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/${reviewId}/verify`, null
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAll(): Observable<ReviewResponse[]> {
    const key = 'all';
    if (!this.reviewListCache$.has(key)) {
      this.reviewListCache$.set(
        key,
        this.http.get<ReviewResponse[]>(`${this.base}/all`).pipe(shareReplay(1))
      );
    }
    return this.reviewListCache$.get(key)!;
  }

  getFlagged(): Observable<ReviewResponse[]> {
    const key = 'flagged';
    if (!this.reviewListCache$.has(key)) {
      this.reviewListCache$.set(
        key,
        this.http.get<ReviewResponse[]>(`${this.base}/flagged`).pipe(shareReplay(1))
      );
    }
    return this.reviewListCache$.get(key)!;
  }

  deleteReview(reviewId: number): Observable<{ message: string }> {
    this.clearCache();
    return this.http.delete<{ message: string }>(`${this.base}/admin/${reviewId}`);
  }

  private clearCache(): void {
    this.reviewCache$.clear();
    this.reviewListCache$.clear();
    this.ratingSummaryCache$.clear();
  }
}