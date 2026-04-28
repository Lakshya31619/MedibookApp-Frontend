// ─── Review Models (review-service port 8086) ──────────────────────────────────

export interface AddReviewRequest {
  appointmentId: number;
  patientId: number;
  providerId: number;
  rating: number;          // 1–5
  comment?: string;
  isAnonymous?: boolean;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  isAnonymous?: boolean;
}

export interface FlagReviewRequest {
  flagReason: string;
}

/** Full review — returned to patient/admin */
export interface ReviewResponse {
  reviewId: number;
  appointmentId: number;
  patientId: number;
  providerId: number;
  rating: number;
  comment: string | null;
  reviewDate: string;
  isVerified: boolean;
  isAnonymous: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
}

/** Public review — shown on provider detail page */
export interface PublicReview {
  reviewId: number;
  patientLabel: string;   // "Anonymous" or "Patient #123"
  rating: number;
  comment: string | null;
  reviewDate: string;
  isVerified: boolean;
}

/** Rating distribution + summary for a provider */
export interface RatingSummary {
  providerId: number;
  avgRating: number;
  totalReviews: number;
  distribution: Record<number, number>; // { 1: 2, 2: 0, 3: 5, 4: 12, 5: 30 }
}