import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppointmentService } from './appointment.service';
import { AppointmentResponse, AppointmentSummary, AppointmentCount, BookAppointmentRequest } from '../models';
import { environment } from '../../../environments/environment';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/appointments`;

  const mockAppointment: AppointmentResponse = {
    appointmentId: 1,
    patientId: 2,
    providerId: 3,
    slotId: 5,
    serviceType: 'General Consultation',
    appointmentDate: '2026-06-01',
    startTime: '09:00',
    endTime: '09:30',
    status: 'SCHEDULED',
    modeOfConsultation: 'IN_PERSON',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any;

  const mockSummary: AppointmentSummary = {
    appointmentId: 1,
    patientId: 2,
    providerId: 3,
    serviceType: 'General Consultation',
    appointmentDate: '2026-06-01',
    startTime: '09:00',
    endTime: '09:30',
    status: 'SCHEDULED',
    modeOfConsultation: 'IN_PERSON',
  } as any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AppointmentService],
    });
    service = TestBed.inject(AppointmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── book ─────────────────────────────────────────────────────────────────────

  it('should POST to /book', () => {
    const req: BookAppointmentRequest = {
      patientId: 2,
      providerId: 3,
      slotId: 5,
      serviceType: 'General Consultation',
      modeOfConsultation: 'IN_PERSON',
    } as any;

    service.book(req).subscribe(res => {
      expect(res.status).toBe('SCHEDULED');
    });

    const httpReq = httpMock.expectOne(`${base}/book`);
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush(mockAppointment);
  });

  // ── getById ──────────────────────────────────────────────────────────────────

  it('should GET /appointments/:id', () => {
    service.getById(1).subscribe(res => {
      expect(res.appointmentId).toBe(1);
    });

    const httpReq = httpMock.expectOne(`${base}/1`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush(mockAppointment);
  });

  // ── getPatientAppointments ────────────────────────────────────────────────────

  it('should GET /patient/:id', () => {
    service.getPatientAppointments(2).subscribe(res => {
      expect(res.length).toBe(1);
    });

    const httpReq = httpMock.expectOne(`${base}/patient/2`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── getPatientUpcoming ────────────────────────────────────────────────────────

  it('should GET /patient/:id/upcoming', () => {
    service.getPatientUpcoming(2).subscribe();
    const httpReq = httpMock.expectOne(`${base}/patient/2/upcoming`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── cancel ───────────────────────────────────────────────────────────────────

  it('should PUT to /:id/cancel with reason', () => {
    service.cancel(1, 'Schedule conflict').subscribe(res => {
      expect(res.status).toBe('CANCELLED');
    });

    const httpReq = httpMock.expectOne(`${base}/1/cancel`);
    expect(httpReq.request.method).toBe('PUT');
    expect(httpReq.request.body).toEqual({ reason: 'Schedule conflict' });
    httpReq.flush({ ...mockAppointment, status: 'CANCELLED' });
  });

  it('should PUT to /:id/cancel without reason', () => {
    service.cancel(1).subscribe();
    const httpReq = httpMock.expectOne(`${base}/1/cancel`);
    expect(httpReq.request.body).toEqual({ reason: undefined });
    httpReq.flush(mockAppointment);
  });

  // ── reschedule ────────────────────────────────────────────────────────────────

  it('should PUT to /:id/reschedule with new slot', () => {
    service.reschedule(1, 10, 'Changed plans').subscribe();
    const httpReq = httpMock.expectOne(`${base}/1/reschedule`);
    expect(httpReq.request.method).toBe('PUT');
    expect(httpReq.request.body).toEqual({ newSlotId: 10, reason: 'Changed plans' });
    httpReq.flush(mockAppointment);
  });

  // ── getProviderAppointments ───────────────────────────────────────────────────

  it('should GET /provider/:id', () => {
    service.getProviderAppointments(3).subscribe();
    const httpReq = httpMock.expectOne(`${base}/provider/3`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── getProviderToday ──────────────────────────────────────────────────────────

  it('should GET /provider/:id/today', () => {
    service.getProviderToday(3).subscribe();
    const httpReq = httpMock.expectOne(`${base}/provider/3/today`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── getProviderUpcoming ───────────────────────────────────────────────────────

  it('should GET /provider/:id/upcoming', () => {
    service.getProviderUpcoming(3).subscribe();
    const httpReq = httpMock.expectOne(`${base}/provider/3/upcoming`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── getProviderByDate ─────────────────────────────────────────────────────────

  it('should GET /provider/:id/date with date query param', () => {
    service.getProviderByDate(3, '2026-06-01').subscribe();
    const httpReq = httpMock.expectOne(
      req => req.url === `${base}/provider/3/date` && req.params.get('date') === '2026-06-01'
    );
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── complete ──────────────────────────────────────────────────────────────────

  it('should PUT to /:id/complete', () => {
    service.complete(1).subscribe(res => {
      expect(res.status).toBe('COMPLETED');
    });
    const httpReq = httpMock.expectOne(`${base}/1/complete`);
    expect(httpReq.request.method).toBe('PUT');
    httpReq.flush({ ...mockAppointment, status: 'COMPLETED' });
  });

  // ── markNoShow ────────────────────────────────────────────────────────────────

  it('should PUT to /:id/no-show', () => {
    service.markNoShow(1).subscribe();
    const httpReq = httpMock.expectOne(`${base}/1/no-show`);
    expect(httpReq.request.method).toBe('PUT');
    httpReq.flush({ ...mockAppointment, status: 'NO_SHOW' });
  });

  // ── getProviderCount ──────────────────────────────────────────────────────────

  it('should GET /provider/:id/count', () => {
    const mockCount: AppointmentCount = {
      providerId: 3,
      total: 10,
      completed: 6,
      scheduled: 3,
      cancelled: 1,
    } as any;

    service.getProviderCount(3).subscribe(count => {
      expect(count.total).toBe(10);
      expect(count.completed).toBe(6);
    });

    const httpReq = httpMock.expectOne(`${base}/provider/3/count`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush(mockCount);
  });

  // ── getAll ────────────────────────────────────────────────────────────────────

  it('should GET /all for admin', () => {
    service.getAll().subscribe(res => {
      expect(res.length).toBe(1);
    });
    const httpReq = httpMock.expectOne(`${base}/all`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockSummary]);
  });

  // ── updateStatus ──────────────────────────────────────────────────────────────

  it('should PUT to /:id/status with value param', () => {
    service.updateStatus(1, 'COMPLETED').subscribe();
    const httpReq = httpMock.expectOne(
      req => req.url === `${base}/1/status` && req.params.get('value') === 'COMPLETED'
    );
    expect(httpReq.request.method).toBe('PUT');
    httpReq.flush(mockAppointment);
  });
});