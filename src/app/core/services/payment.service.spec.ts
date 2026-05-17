import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import {
  PaymentResponse, PaymentSummary, ProcessPaymentRequest,
  EarningsSummary, Invoice, PlatformRevenue,
  RazorpayOrderRequest, RazorpayOrderResponse, RazorpayVerifyRequest,
} from '../payment.models';
import { environment } from '../../../environments/environment';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  const base = `${environment.apiUrl}/api/payments`;

  const mockPayment: PaymentResponse = {
    paymentId: 1,
    appointmentId: 10,
    patientId: 2,
    providerId: 3,
    amount: 500,
    status: 'PAID',
    mode: 'CASH',
    transactionId: 'txn_001',
    currency: 'INR',
    paidAt: '2026-06-01T10:00:00Z',
    refundedAt: null,
    refundTransactionId: null,
    notes: null,
    createdAt: '2026-06-01T09:00:00Z',
  };

  const mockSummary: PaymentSummary = {
    paymentId: 1,
    appointmentId: 10,
    amount: 500,
    status: 'PAID',
    mode: 'CASH',
    paidAt: '2026-06-01T10:00:00Z',
    currency: 'INR',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentService],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  // ── processPayment ────────────────────────────────────────────────────────

  it('should POST to /process for cash payment', () => {
    const body: ProcessPaymentRequest = {
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      amount: 500,
      mode: 'CASH',
    };

    service.processPayment(body).subscribe(res => {
      expect(res.status).toBe('PAID');
      expect(res.mode).toBe('CASH');
    });

    const req = httpMock.expectOne(`${base}/process`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockPayment);
  });

  // ── getByAppointment ──────────────────────────────────────────────────────

  it('should GET /appointment/:id', () => {
    service.getByAppointment(10).subscribe(res => {
      expect(res.paymentId).toBe(1);
      expect(res.appointmentId).toBe(10);
    });

    const req = httpMock.expectOne(`${base}/appointment/10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPayment);
  });

  // ── getByPatient ──────────────────────────────────────────────────────────

  it('should GET /patient/:id', () => {
    service.getByPatient(2).subscribe(res => {
      expect(res.length).toBe(1);
      expect(res[0].paymentId).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/patient/2`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── getPatientTotal ───────────────────────────────────────────────────────

  it('should GET /patient/:id/total', () => {
    service.getPatientTotal(2).subscribe(res => {
      expect(res.totalSpending).toBe(1500);
      expect(res.currency).toBe('INR');
    });

    const req = httpMock.expectOne(`${base}/patient/2/total`);
    expect(req.request.method).toBe('GET');
    req.flush({ patientId: 2, totalSpending: 1500, currency: 'INR' });
  });

  // ── getStatus ─────────────────────────────────────────────────────────────

  it('should GET /status/:appointmentId', () => {
    service.getStatus(10).subscribe(res => {
      expect(res.status).toBe('PAID');
    });

    const req = httpMock.expectOne(`${base}/status/10`);
    expect(req.request.method).toBe('GET');
    req.flush({ appointmentId: 10, status: 'PAID' });
  });

  // ── getInvoice ────────────────────────────────────────────────────────────

  it('should GET /invoice/:appointmentId', () => {
    const mockInvoice: Invoice = {
      invoiceNumber: 'INV-001',
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      amount: 500,
      currency: 'INR',
      mode: 'CASH',
      transactionId: 'txn_001',
      paidAt: '2026-06-01T10:00:00Z',
      generatedAt: '2026-06-01T10:01:00Z',
    };

    service.getInvoice(10).subscribe(res => {
      expect(res.invoiceNumber).toBe('INV-001');
      expect(res.appointmentId).toBe(10);
    });

    const req = httpMock.expectOne(`${base}/invoice/10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockInvoice);
  });

  // ── refund ────────────────────────────────────────────────────────────────

  it('should POST to /razorpay/refund/:id with reason', () => {
    service.refund(10, 'Doctor unavailable').subscribe(res => {
      expect(res.status).toBe('REFUNDED');
    });

    const req = httpMock.expectOne(`${base}/razorpay/refund/10`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ reason: 'Doctor unavailable' });
    req.flush({ message: 'Refunded', status: 'REFUNDED', refundTransactionId: 'rfnd_001', notes: '' });
  });

  it('should POST to /razorpay/refund/:id without reason', () => {
    service.refund(10).subscribe();

    const req = httpMock.expectOne(`${base}/razorpay/refund/10`);
    expect(req.request.body).toEqual({ reason: undefined });
    req.flush({ message: 'Refunded', status: 'REFUNDED', refundTransactionId: 'rfnd_001', notes: '' });
  });

  // ── createRazorpayOrder ───────────────────────────────────────────────────

  it('should POST to /razorpay/create-order', () => {
    const body: RazorpayOrderRequest = {
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      amount: 500,
    };
    const mockOrder: RazorpayOrderResponse = {
      orderId: 'order_ABC123',
      currency: 'INR',
      amountPaise: 50000,
      keyId: 'rzp_test_key',
    };

    service.createRazorpayOrder(body).subscribe(res => {
      expect(res.orderId).toBe('order_ABC123');
      expect(res.amountPaise).toBe(50000);
    });

    const req = httpMock.expectOne(`${base}/razorpay/create-order`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockOrder);
  });

  // ── verifyRazorpayPayment ─────────────────────────────────────────────────

  it('should POST to /razorpay/verify', () => {
    const body: RazorpayVerifyRequest = {
      razorpayOrderId: 'order_ABC123',
      razorpayPaymentId: 'pay_XYZ',
      razorpaySignature: 'sig_hash',
      appointmentId: 10,
      patientId: 2,
      providerId: 3,
      amount: 500,
      mode: 'CARD',
    };

    service.verifyRazorpayPayment(body).subscribe(res => {
      expect(res.status).toBe('PAID');
    });

    const req = httpMock.expectOne(`${base}/razorpay/verify`);
    expect(req.request.method).toBe('POST');
    req.flush(mockPayment);
  });

  // ── getByProvider ─────────────────────────────────────────────────────────

  it('should GET /provider/:id', () => {
    service.getByProvider(3).subscribe(res => {
      expect(Array.isArray(res)).toBeTrue();
    });

    const req = httpMock.expectOne(`${base}/provider/3`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSummary]);
  });

  // ── getEarnings ───────────────────────────────────────────────────────────

  it('should GET /earnings/:providerId', () => {
    const mockEarnings: EarningsSummary = {
      providerId: 3,
      totalEarned: 10000,
      pendingAmount: 500,
      totalRefunded: 200,
      netEarnings: 9800,
    };

    service.getEarnings(3).subscribe(res => {
      expect(res.totalEarned).toBe(10000);
      expect(res.netEarnings).toBe(9800);
    });

    const req = httpMock.expectOne(`${base}/earnings/3`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEarnings);
  });

  // ── confirmCash ───────────────────────────────────────────────────────────

  it('should POST to /confirm-cash/:appointmentId', () => {
    service.confirmCash(10).subscribe(res => {
      expect(res.status).toBe('PAID');
    });

    const req = httpMock.expectOne(`${base}/confirm-cash/10`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Confirmed', appointmentId: 10, status: 'PAID', paidAt: '2026-06-01T10:00:00Z' });
  });

  // ── getAll (Admin) ────────────────────────────────────────────────────────

  it('should GET /all for admin', () => {
    service.getAll().subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/all`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPayment]);
  });

  // ── updateStatus ──────────────────────────────────────────────────────────

  it('should PUT to /admin/:id/status with value param', () => {
    service.updateStatus(1, 'REFUNDED').subscribe(res => {
      expect(res.paymentId).toBe(1);
    });

    const req = httpMock.expectOne(
      r => r.url === `${base}/admin/1/status` && r.params.get('value') === 'REFUNDED'
    );
    expect(req.request.method).toBe('PUT');
    req.flush({ message: 'Updated', paymentId: 1 });
  });

  // ── getPlatformRevenue ────────────────────────────────────────────────────

  it('should GET /revenue', () => {
    const mockRevenue: PlatformRevenue = {
      totalRevenue: 100000,
      monthlyBreakdown: [{ year: 2026, month: 5, monthName: 'May', revenue: 20000 }],
    };

    service.getPlatformRevenue().subscribe(res => {
      expect(res.totalRevenue).toBe(100000);
      expect(res.monthlyBreakdown.length).toBe(1);
    });

    const req = httpMock.expectOne(`${base}/revenue`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRevenue);
  });

  // ── getTotalRevenue ───────────────────────────────────────────────────────

  it('should GET /revenue/total', () => {
    service.getTotalRevenue().subscribe(res => {
      expect(res.totalRevenue).toBe(100000);
    });

    const req = httpMock.expectOne(`${base}/revenue/total`);
    expect(req.request.method).toBe('GET');
    req.flush({ totalRevenue: 100000, currency: 'INR' });
  });

  // ── getByRange ────────────────────────────────────────────────────────────

  it('should GET /admin/range with start and end params', () => {
    service.getByRange('2026-05-01', '2026-05-31').subscribe(res => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne(
      r => r.url === `${base}/admin/range` &&
           r.params.get('start') === '2026-05-01' &&
           r.params.get('end') === '2026-05-31'
    );
    expect(req.request.method).toBe('GET');
    req.flush([mockPayment]);
  });
});