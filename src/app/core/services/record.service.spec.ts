import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RecordService } from './record.service';
import { CreateRecordRequest, UpdateRecordRequest, RecordResponse } from '../record.models';
import { environment } from '../../../environments/environment';

describe('RecordService', () => {
  let service: RecordService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/records`;

  const mockRecord: RecordResponse = {
    recordId: 1,
    appointmentId: 10,
    patientId: 2,
    providerId: 3,
    diagnosis: 'Hypertension',
    prescription: 'Amlodipine 5mg',
    notes: 'Monitor BP daily',
    attachmentUrl: null,
    followUpDate: '2026-07-01',
    followUpReminderSent: false,
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    editable: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RecordService],
    });
    service = TestBed.inject(RecordService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── createRecord ──────────────────────────────────────────────────────────

  it('should POST to /records', () => {
    const body: CreateRecordRequest = {
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      diagnosis: 'Hypertension',
      prescription: 'Amlodipine 5mg',
      notes: 'Monitor BP daily',
      followUpDate: '2026-07-01',
    };

    service.createRecord(body).subscribe(res => {
      expect(res.recordId).toBe(1);
      expect(res.diagnosis).toBe('Hypertension');
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockRecord);
  });

  // ── getByProvider ─────────────────────────────────────────────────────────

  it('should GET /records/provider/:id', () => {
    service.getByProvider(3).subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].providerId).toBe(3);
    });

    const req = httpMock.expectOne(`${base}/provider/3`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRecord]);
  });

  it('should accept string providerId for getByProvider', () => {
    service.getByProvider('p3').subscribe();
    const req = httpMock.expectOne(`${base}/provider/p3`);
    req.flush([]);
  });

  // ── updateRecord ──────────────────────────────────────────────────────────

  it('should PUT to /records/:id', () => {
    const update: UpdateRecordRequest = { diagnosis: 'Stage 2 Hypertension', notes: 'Increased dosage' };

    service.updateRecord(1, update).subscribe(res => {
      expect(res.recordId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(update);
    req.flush({ ...mockRecord, ...update });
  });

  // ── attachDocument ────────────────────────────────────────────────────────

  it('should PUT to /records/adminattach with recordId and URL', () => {
    service.attachDocument(1, 'https://storage/doc.pdf').subscribe(res => {
      expect(res.attachmentUrl).toBe('https://storage/doc.pdf');
    });

    const req = httpMock.expectOne(`${base}/adminattach`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ recordId: 1, attachmentUrl: 'https://storage/doc.pdf' });
    req.flush({ ...mockRecord, attachmentUrl: 'https://storage/doc.pdf' });
  });

  // ── getByPatient ──────────────────────────────────────────────────────────

  it('should GET /records/patient/:id', () => {
    service.getByPatient(2).subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].patientId).toBe(2);
    });

    const req = httpMock.expectOne(`${base}/patient/2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRecord]);
  });

  // ── getByAppointment ──────────────────────────────────────────────────────

  it('should GET /records/appointment/:id', () => {
    service.getByAppointment(10).subscribe(res => {
      expect(res.appointmentId).toBe(10);
    });

    const req = httpMock.expectOne(`${base}/appointment/10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRecord);
  });

  // ── getRecordCount ────────────────────────────────────────────────────────

  it('should GET /records/patient/:id/count', () => {
    service.getRecordCount(2).subscribe(res => {
      expect(res.count).toBe(5);
    });

    const req = httpMock.expectOne(`${base}/patient/2/count`);
    expect(req.request.method).toBe('GET');
    req.flush({ count: 5 });
  });

  // ── getById ───────────────────────────────────────────────────────────────

  it('should GET /records/:id', () => {
    service.getById(1).subscribe(res => {
      expect(res.recordId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRecord);
  });

  // ── getAll (Admin) ────────────────────────────────────────────────────────

  it('should GET /records for admin', () => {
    service.getAll().subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([mockRecord]);
  });

  // ── getAllWithFollowUp ────────────────────────────────────────────────────

  it('should GET /records/followup', () => {
    service.getAllWithFollowUp().subscribe(res => {
      expect(res[0].followUpDate).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/followup`);
    expect(req.request.method).toBe('GET');
    req.flush([mockRecord]);
  });

  // ── processFollowUpReminders ──────────────────────────────────────────────

  it('should POST to /records/followup/process', () => {
    service.processFollowUpReminders().subscribe(res => {
      expect(res.sent).toBe(3);
    });

    const req = httpMock.expectOne(`${base}/followup/process`);
    expect(req.request.method).toBe('POST');
    req.flush({ sent: 3 });
  });

  // ── deleteRecord ──────────────────────────────────────────────────────────

  it('should DELETE /records/:id', () => {
    service.deleteRecord(1).subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Record deleted' });
  });
});