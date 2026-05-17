import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProviderService } from './provider.service';
import { ProviderResponse, ProviderSummary, ProviderRegisterRequest, SpecializationCount } from '../models';
import { environment } from '../../../environments/environment';

describe('ProviderService', () => {
  let service: ProviderService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/providers`;

  const mockSummary: ProviderSummary = {
    providerId: 1,
    providerName: 'Dr. Alice',
    specialization: 'Cardiology',
    clinicName: 'Heart Clinic',
    clinicAddress: '123 Main St',
    avgRating: 4.5,
    available: true,
    consultationFee: 500,
    profilePicUrl: '',
    experienceYears: 10,
  };

  const mockResponse: ProviderResponse = {
    providerId: 1,
    userId: 1,
    providerName: 'Dr. Alice',
    specialization: 'Cardiology',
    qualification: 'MBBS, MD',
    experienceYears: 10,
    bio: 'Expert cardiologist',
    clinicName: 'Heart Clinic',
    clinicAddress: '123 Main St',
    avgRating: 4.5,
    available: true,
    verified: true,
    verificationStatus: 'APPROVED',
    consultationFee: 500,
    profilePicUrl: '',
    createdAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProviderService],
    });
    service = TestBed.inject(ProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getAll ────────────────────────────────────────────────────────────────

  it('should GET /providers', () => {
    service.getAll().subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].providerId).toBe(1);
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── getById ───────────────────────────────────────────────────────────────

  it('should GET /providers/:id', () => {
    service.getById(1).subscribe(res => {
      expect(res.providerId).toBe(1);
      expect(res.verified).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // ── search ────────────────────────────────────────────────────────────────

  it('should GET /providers/search with q param', () => {
    service.search('alice').subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(r => r.url === `${base}/search` && r.params.get('q') === 'alice');
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── bySpecialization ──────────────────────────────────────────────────────

  it('should GET /providers/specialization/:spec', () => {
    service.bySpecialization('Cardiology').subscribe(res => {
      expect(res[0].specialization).toBe('Cardiology');
    });

    const req = httpMock.expectOne(`${base}/specialization/Cardiology`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── byLocation ────────────────────────────────────────────────────────────

  it('should GET /providers/location with city param', () => {
    service.byLocation('Mumbai').subscribe();

    const req = httpMock.expectOne(r => r.url === `${base}/location` && r.params.get('city') === 'Mumbai');
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── register ──────────────────────────────────────────────────────────────

  it('should POST to /providers/register', () => {
    const body: ProviderRegisterRequest = {
      userId: 1,
      specialization: 'Cardiology',
      qualification: 'MBBS',
      experienceYears: 5,
    };

    service.register(body).subscribe(res => {
      expect(res.verificationStatus).toBe('PENDING');
      expect(res.providerId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ message: 'Registered', providerId: 1, verificationStatus: 'PENDING' });
  });

  // ── getMyProfile ──────────────────────────────────────────────────────────

  it('should GET /providers/my/:userId', () => {
    service.getMyProfile(1).subscribe(res => {
      expect(res.userId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/my/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  // ── update ────────────────────────────────────────────────────────────────

  it('should PUT to /providers/:id', () => {
    const updates: Partial<ProviderRegisterRequest> = { bio: 'Updated bio' };

    service.update(1, updates).subscribe(res => {
      expect(res.providerId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updates);
    req.flush(mockResponse);
  });

  // ── setAvailability ───────────────────────────────────────────────────────

  it('should PUT /providers/:id/availability with status=true', () => {
    service.setAvailability(1, true).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${base}/1/availability` && r.params.get('status') === 'true'
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockResponse, available: true });
  });

  it('should PUT /providers/:id/availability with status=false', () => {
    service.setAvailability(1, false).subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${base}/1/availability` && r.params.get('status') === 'false'
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockResponse, available: false });
  });

  // ── adminGetAll ───────────────────────────────────────────────────────────

  it('should GET /providers/admin/all', () => {
    service.adminGetAll().subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/admin/all`);
    expect(req.request.method).toBe('GET');
    req.flush([mockResponse]);
  });

  // ── adminGetPending ───────────────────────────────────────────────────────

  it('should GET /providers/admin/pending', () => {
    const pendingProvider = { ...mockResponse, verificationStatus: 'PENDING' as const };
    service.adminGetPending().subscribe(res => {
      expect(res[0].verificationStatus).toBe('PENDING');
    });

    const req = httpMock.expectOne(`${base}/admin/pending`);
    expect(req.request.method).toBe('GET');
    req.flush([pendingProvider]);
  });

  // ── approve ───────────────────────────────────────────────────────────────

  it('should PUT to /providers/:id/verify', () => {
    service.approve(1).subscribe(res => {
      expect(res.verificationStatus).toBe('APPROVED');
    });

    const req = httpMock.expectOne(`${base}/1/verify`);
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Approved', providerId: 1, verificationStatus: 'APPROVED' });
  });

  // ── reject ────────────────────────────────────────────────────────────────

  it('should POST to /providers/:id/reject with reason', () => {
    service.reject(1, 'Invalid credentials').subscribe(res => {
      expect(res.verificationStatus).toBe('REJECTED');
      expect(res.reason).toBe('Invalid credentials');
    });

    const req = httpMock.expectOne(`${base}/1/reject`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'Invalid credentials' });
    req.flush({ message: 'Rejected', providerId: 1, verificationStatus: 'REJECTED', reason: 'Invalid credentials' });
  });

  // ── unverify ──────────────────────────────────────────────────────────────

  it('should PUT to /providers/:id/unverify', () => {
    service.unverify(1).subscribe(res => {
      expect(res.verified).toBeDefined();
    });

    const req = httpMock.expectOne(`${base}/1/unverify`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockResponse, verified: false });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  it('should DELETE /providers/:id', () => {
    service.delete(1).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Provider deleted' });
  });

  // ── getSpecializationAnalytics ────────────────────────────────────────────

  it('should GET /providers/analytics/specializations', () => {
    const mockCounts: SpecializationCount[] = [
      { specialization: 'Cardiology', count: 5 },
      { specialization: 'Neurology', count: 3 },
    ];

    service.getSpecializationAnalytics().subscribe(res => {
      expect(res.length).toBe(2);
      expect(res[0].specialization).toBe('Cardiology');
    });

    const req = httpMock.expectOne(`${base}/analytics/specializations`);
    expect(req.request.method).toBe('GET');
    req.flush(mockCounts);
  });
});