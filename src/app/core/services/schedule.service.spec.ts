import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ScheduleService } from './schedule.service';
import { SlotResponse, SlotSummary, RecurringSlotRequest } from '../models';
import { environment } from '../../../environments/environment';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/slots`;

  const mockSummary: SlotSummary = {
    slotId: 's1',
    date: '2026-06-01',
    startTime: '09:00',
    endTime: '09:30',
    durationMinutes: 30,
  };

  const mockSlot: SlotResponse = {
    slotId: 's1',
    providerId: 'p1',
    date: '2026-06-01',
    startTime: '09:00',
    endTime: '09:30',
    durationMinutes: 30,
    booked: false,
    blocked: false,
    createdAt: '2026-05-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ScheduleService],
    });
    service = TestBed.inject(ScheduleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── getAvailableByDate ────────────────────────────────────────────────────

  it('should GET /slots/available/:providerId with date param', () => {
    service.getAvailableByDate('p1', '2026-06-01').subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].slotId).toBe('s1');
    });

    const req = httpMock.expectOne(
      r => r.url === `${base}/available/p1` && r.params.get('date') === '2026-06-01'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── getFutureAvailable ────────────────────────────────────────────────────

  it('should GET /slots/provider/:id/available', () => {
    service.getFutureAvailable('p1').subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/provider/p1/available`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── getSlotCount ──────────────────────────────────────────────────────────

  it('should GET /slots/provider/:id/count', () => {
    service.getSlotCount('p1').subscribe(res => {
      expect(res.availableSlots).toBe(12);
    });

    const req = httpMock.expectOne(`${base}/provider/p1/count`);
    expect(req.request.method).toBe('GET');
    req.flush({ providerId: 'p1', availableSlots: 12 });
  });

  // ── getSlot ───────────────────────────────────────────────────────────────

  it('should GET /slots/:slotId', () => {
    service.getSlot('s1').subscribe(res => {
      expect(res.slotId).toBe('s1');
      expect(res.booked).toBeFalse();
    });

    const req = httpMock.expectOne(`${base}/s1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSlot);
  });

  // ── getProviderSlots ──────────────────────────────────────────────────────

  it('should GET /slots/provider/:id', () => {
    service.getProviderSlots('p1').subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/provider/p1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSlot]);
  });

  // ── getProviderSlotsInRange ───────────────────────────────────────────────

  it('should GET /slots/provider/:id/range with date params', () => {
    service.getProviderSlotsInRange('p1', '2026-06-01', '2026-06-30').subscribe();

    const req = httpMock.expectOne(
      r => r.url === `${base}/provider/p1/range` &&
           r.params.get('startDate') === '2026-06-01' &&
           r.params.get('endDate') === '2026-06-30'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockSlot]);
  });

  // ── addSlot ───────────────────────────────────────────────────────────────

  it('should POST to /slots/add', () => {
    const body = { providerId: 'p1', date: '2026-06-01', startTime: '10:00', endTime: '10:30' };

    service.addSlot(body).subscribe(res => {
      expect(res.slotId).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/add`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockSlot);
  });

  // ── addBulkSlots ──────────────────────────────────────────────────────────

  it('should POST to /slots/bulk', () => {
    const body = {
      providerId: 'p1',
      slots: [{ date: '2026-06-01', startTime: '09:00', endTime: '09:30' }],
    };

    service.addBulkSlots(body).subscribe(res => {
      expect(res.slotsCreated).toBe(1);
      expect(res.slotsSkipped).toBe(0);
    });

    const req = httpMock.expectOne(`${base}/bulk`);
    expect(req.request.method).toBe('POST');
    req.flush({ slotsCreated: 1, slotsSkipped: 0, message: 'Slots created' });
  });

  // ── addRecurringSlots ─────────────────────────────────────────────────────

  it('should POST to /slots/recurring', () => {
    const body: RecurringSlotRequest = {
      providerId: 'p1',
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      startTime: '09:00',
      endTime: '17:00',
      slotDurationMinutes: 30,
      recurrenceType: 'WEEKDAYS',
    };

    service.addRecurringSlots(body).subscribe(res => {
      expect(res.slotsCreated).toBeGreaterThan(0);
    });

    const req = httpMock.expectOne(`${base}/recurring`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ slotsCreated: 20, slotsSkipped: 0, message: 'Recurring slots created' });
  });

  // ── blockSlot ─────────────────────────────────────────────────────────────

  it('should PUT to /slots/:id/block', () => {
    service.blockSlot('s1').subscribe(res => {
      expect(res.blocked).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/s1/block`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockSlot, blocked: true });
  });

  // ── unblockSlot ───────────────────────────────────────────────────────────

  it('should PUT to /slots/:id/unblock', () => {
    service.unblockSlot('s1').subscribe(res => {
      expect(res.blocked).toBeFalse();
    });

    const req = httpMock.expectOne(`${base}/s1/unblock`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockSlot, blocked: false });
  });

  // ── deleteSlot ────────────────────────────────────────────────────────────

  it('should DELETE /slots/:id', () => {
    service.deleteSlot('s1').subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/s1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Slot deleted' });
  });

  // ── purgeSlots (Admin) ────────────────────────────────────────────────────

  it('should POST to /slots/admin/purge', () => {
    service.purgeSlots().subscribe(res => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${base}/admin/purge`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Old slots purged' });
  });
});