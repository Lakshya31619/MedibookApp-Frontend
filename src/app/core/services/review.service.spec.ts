import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReviewService } from './review.service';
import {
  AddReviewRequest, UpdateReviewRequest,
  ReviewResponse, PublicReview, RatingSummary,
} from '../review.models';
import { environment } from '../../../environments/environment';

describe('ReviewService', () => {
  let service: ReviewService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/reviews`;

  const mockReview: ReviewResponse = {
    reviewId: 1,
    appointmentId: 10,
    patientId: 2,
    providerId: 3,
    rating: 5,
    comment: 'Excellent doctor!',
    reviewDate: '2026-06-01',
    isVerified: true,
    isAnonymous: false,
    isFlagged: false,
    flagReason: null,
    createdAt: '2026-06-01T10:00:00Z',
  };

  const mockPublicReview: PublicReview = {
    reviewId: 1,
    patientLabel: 'Patient #2',
    rating: 5,
    comment: 'Excellent doctor!',
    reviewDate: '2026-06-01',
    isVerified: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReviewService],
    });
    service = TestBed.inject(ReviewService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getByProvider ─────────────────────────────────────────────────────────

  it('should GET /reviews/provider/:id', () => {
    service.getByProvider('3').subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].rating).toBe(5);
    });

    const req = httpMock.expectOne(`${base}/provider/3`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPublicReview]);
  });

  it('should accept numeric providerId', () => {
    service.getByProvider(3).subscribe();
    const req = httpMock.expectOne(`${base}/provider/3`);
    req.flush([mockPublicReview]);
  });

  // ── getAvgRating ──────────────────────────────────────────────────────────

  it('should GET /reviews/rating/:providerId', () => {
    service.getAvgRating(3).subscribe(res => {
      expect(res.avgRating).toBe(4.8);
      expect(res.totalReviews).toBe(25);
    });

    const req = httpMock.expectOne(`${base}/rating/3`);
    expect(req.request.method).toBe('GET');
    req.flush({ providerId: 3, avgRating: 4.8, totalReviews: 25 });
  });

  // ── getRatingSummary ──────────────────────────────────────────────────────

  it('should GET /reviews/summary/:providerId', () => {
    const mockSummary: RatingSummary = {
      providerId: 3,
      avgRating: 4.6,
      totalReviews: 30,
      distribution: { 1: 0, 2: 1, 3: 3, 4: 10, 5: 16 },
    };

    service.getRatingSummary(3).subscribe(res => {
      expect(res.avgRating).toBe(4.6);
      expect(res.distribution[5]).toBe(16);
    });

    const req = httpMock.expectOne(`${base}/summary/3`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  // ── addReview ─────────────────────────────────────────────────────────────

  it('should POST to /reviews', () => {
    const body: AddReviewRequest = {
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      rating: 5,
      comment: 'Great experience',
      isAnonymous: false,
    };

    service.addReview(body).subscribe(res => {
      expect(res.reviewId).toBe(1);
      expect(res.rating).toBe(5);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockReview);
  });

  // ── getByAppointment ──────────────────────────────────────────────────────

  it('should GET /reviews/appointment/:id', () => {
    service.getByAppointment(10).subscribe(res => {
      expect(res.appointmentId).toBe(10);
    });

    const req = httpMock.expectOne(`${base}/appointment/10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReview);
  });

  // ── getByPatient ──────────────────────────────────────────────────────────

  it('should GET /reviews/patient/:id', () => {
    service.getByPatient(2).subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/patient/2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockReview]);
  });

  // ── updateReview ──────────────────────────────────────────────────────────

  it('should PUT to /reviews/:id', () => {
    const update: UpdateReviewRequest = { rating: 4, comment: 'Good overall' };

    service.updateReview(1, update).subscribe(res => {
      expect(res.reviewId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(update);
    req.flush({ ...mockReview, rating: 4, comment: 'Good overall' });
  });

  // ── flagReview ────────────────────────────────────────────────────────────

  it('should PUT to /reviews/:id/flag with reason', () => {
    service.flagReview(1, 'Inappropriate content').subscribe(res => {
      expect(res.reviewId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1/flag`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ flagReason: 'Inappropriate content' });
    req.flush({ message: 'Flagged', reviewId: 1 });
  });

  // ── unflagReview ──────────────────────────────────────────────────────────

  it('should PUT to /reviews/:id/unflag', () => {
    service.unflagReview(1).subscribe(res => {
      expect(res.reviewId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1/unflag`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Unflagged', reviewId: 1 });
  });

  // ── verifyReview ──────────────────────────────────────────────────────────

  it('should PUT to /reviews/:id/verify', () => {
    service.verifyReview(1).subscribe(res => {
      expect(res.reviewId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1/verify`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Verified', reviewId: 1 });
  });

  // ── getAll (Admin) ────────────────────────────────────────────────────────

  it('should GET /reviews/all for admin', () => {
    service.getAll().subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([mockReview]);
  });

  // ── getFlagged ────────────────────────────────────────────────────────────

  it('should GET /reviews/flagged', () => {
    const flaggedReview = { ...mockReview, isFlagged: true, flagReason: 'Spam' };

    service.getFlagged().subscribe(res => {
      expect(res[0].isFlagged).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/flagged`);
    expect(req.request.method).toBe('GET');
    req.flush([flaggedReview]);
  });

  // ── deleteReview ──────────────────────────────────────────────────────────

  it('should DELETE /reviews/admin/:id', () => {
    service.deleteReview(1).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/admin/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Review deleted' });
  });
});