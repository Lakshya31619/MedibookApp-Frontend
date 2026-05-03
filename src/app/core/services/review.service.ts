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
  private base = `${environment.apiUrl}/api/reviews`;

  constructor(private http: HttpClient) {}

  // ── Public ──────────────────────────────────────────────────────────────────

  getByProvider(providerId: string | number): Observable<PublicReview[]> {
    return this.http.get<PublicReview[]>(`${this.base}/provider/${providerId}`);
  }

  getAvgRating(providerId: string | number): Observable<{ providerId: number; avgRating: number; totalReviews: number }> {
    return this.http.get<{ providerId: number; avgRating: number; totalReviews: number }>(
      `${this.base}/rating/${providerId}`
    );
  }

  getRatingSummary(providerId: string | number): Observable<RatingSummary> {
    return this.http.get<RatingSummary>(`${this.base}/summary/${providerId}`);
  }

  // ── Patient ────────────────────────────────────────────────────────────────

  addReview(body: AddReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.base}`, body);
  }

  getByAppointment(appointmentId: number): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.base}/appointment/${appointmentId}`);
  }

  getByPatient(patientId: string | number): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/patient/${patientId}`);
  }

  updateReview(reviewId: number, body: UpdateReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.base}/${reviewId}`, body);
  }

  // ── Provider ───────────────────────────────────────────────────────────────

  flagReview(reviewId: number, flagReason: string): Observable<{ message: string; reviewId: number }> {
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/${reviewId}/flag`, { flagReason } satisfies FlagReviewRequest
    );
  }

  unflagReview(reviewId: number): Observable<{ message: string; reviewId: number }> {
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/${reviewId}/unflag`, null
    );
  }

  verifyReview(reviewId: number): Observable<{ message: string; reviewId: number }> {
    return this.http.put<{ message: string; reviewId: number }>(
      `${this.base}/${reviewId}/verify`, null
    );
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  getAll(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/all`);
  }

  getFlagged(): Observable<ReviewResponse[]> {
    return this.http.get<ReviewResponse[]>(`${this.base}/flagged`);
  }

  deleteReview(reviewId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/admin/${reviewId}`);
  }
}