import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { PaymentService } from '../../core/services/payment.service';
import { ToastService } from '../../core/services/toast.service';
import { FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';
import { AppointmentResponse } from '../../core/models';
import { PaymentMode, RazorpayHandlerResponse } from '../../core/payment.models';

// Razorpay is loaded globally via checkout.js in index.html
declare const Razorpay: any;

type BookingStep = 'details' | 'payment' | 'confirmation';

@Component({
  selector: 'app-patient-book',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, IconComponent, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="max-w-xl mx-auto page-enter">

        <!-- Back -->
        <button (click)="router.navigate(['/patient/appointments'])"
                class="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <app-icon name="arrow-left" [size]="15"></app-icon>
          Back
        </button>

        <!-- Step indicator -->
        <div class="flex items-center gap-2 mb-8">
          @for (step of steps; track step.key; let i = $index) {
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
                     [ngClass]="currentStep === step.key ? 'bg-navy-700 text-white'
                               : isStepDone(step.key)      ? 'bg-emerald-500 text-white'
                               : 'bg-slate-100 text-slate-400'">
                  @if (isStepDone(step.key)) {
                    <app-icon name="check" [size]="13"></app-icon>
                  } @else {
                    {{ i + 1 }}
                  }
                </div>
                <span class="text-sm font-medium hidden sm:block"
                      [ngClass]="currentStep === step.key ? 'text-slate-800' : 'text-slate-400'">
                  {{ step.label }}
                </span>
              </div>
              @if (i < steps.length - 1) {
                <div class="w-8 h-px bg-slate-200 mx-1"></div>
              }
            </div>
          }
        </div>

        <!-- ─── STEP 1: Appointment Details ─── -->
        @if (currentStep === 'details') {
          <div class="card mb-4">
            <p class="section-label">Appointment Summary</p>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500">Date</span>
                <span class="font-medium text-slate-800">{{ date | formatDate }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Time</span>
                <span class="font-medium text-slate-800">{{ startTime | formatTime }} – {{ endTime | formatTime }}</span>
              </div>
              @if (consultationFee) {
                <div class="flex justify-between">
                  <span class="text-slate-500">Consultation Fee</span>
                  <span class="font-semibold text-navy-700">₹{{ consultationFee }}</span>
                </div>
              }
            </div>
          </div>

          <div class="card mb-5">
            <p class="section-label">Appointment Details</p>

            <div class="mb-4">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Service Type</label>
              <input type="text" [(ngModel)]="serviceType" class="input-field"
                     placeholder="e.g. General Consultation, Follow-up">
            </div>

            <div class="mb-5">
              <label class="block text-sm font-medium text-slate-700 mb-2">Mode of Consultation</label>
              <div class="grid grid-cols-2 gap-3">
                <button type="button" (click)="mode = 'IN_PERSON'"
                  class="py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  [ngClass]="mode === 'IN_PERSON' ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                  <app-icon name="stethoscope" [size]="16"></app-icon>
                  In-Person
                </button>
                <button type="button" (click)="mode = 'VIDEO'"
                  class="py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2"
                  [ngClass]="mode === 'VIDEO' ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                  <app-icon name="video" [size]="16"></app-icon>
                  Video Call
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Notes <span class="text-slate-400 font-normal">(optional)</span></label>
              <textarea [(ngModel)]="notes" rows="3" class="input-field resize-none"
                        placeholder="Describe your symptoms or any specific concerns…"></textarea>
            </div>
          </div>

          @if (stepError) {
            <div class="alert-danger mb-4 text-sm">
              <app-icon name="alert-circle" [size]="16" class="flex-shrink-0"></app-icon>
              {{ stepError }}
            </div>
          }

          <button (click)="goToPayment()" [disabled]="!serviceType.trim()"
                  class="btn-primary w-full py-3 text-sm">
            Continue to Payment
            <app-icon name="chevron-right" [size]="15"></app-icon>
          </button>
        }

        <!-- ─── STEP 2: Payment ─── -->
        @if (currentStep === 'payment') {
          <div class="card mb-4">
            <p class="section-label">Amount to Pay</p>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-bold text-navy-700">₹{{ consultationFee || 0 }}</span>
              <span class="text-slate-400 text-sm">INR</span>
            </div>
          </div>

          <div class="card mb-5">
            <p class="section-label">Select Payment Method</p>
            <div class="grid grid-cols-2 gap-3 mb-5">
              @for (pm of paymentModes; track pm.value) {
                <button type="button" (click)="paymentMode = pm.value"
                  class="py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all flex items-center gap-2.5"
                  [ngClass]="paymentMode === pm.value
                    ? 'border-navy-700 bg-navy-50 text-navy-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'">
                  <app-icon [name]="pm.icon" [size]="16" class="flex-shrink-0"></app-icon>
                  {{ pm.label }}
                </button>
              }
            </div>

            <!-- Razorpay info for online modes -->
            @if (paymentMode !== 'CASH') {
              <div class="alert-info text-sm">
                <app-icon name="shield-check" [size]="16" class="flex-shrink-0"></app-icon>
                <span>
                  You'll be redirected to the Razorpay secure checkout to complete payment via
                  {{ paymentMode === 'UPI' ? 'UPI' : paymentMode === 'CARD' ? 'card' : 'wallet' }}.
                </span>
              </div>
            }

            @if (paymentMode === 'CASH') {
              <div class="alert-info text-sm">
                <app-icon name="info" [size]="16" class="flex-shrink-0"></app-icon>
                <span>Pay cash at the clinic. The provider will confirm receipt after your visit.</span>
              </div>
            }
          </div>

          @if (stepError) {
            <div class="alert-danger mb-4 text-sm">
              <app-icon name="alert-circle" [size]="16" class="flex-shrink-0"></app-icon>
              {{ stepError }}
            </div>
          }

          <div class="flex gap-3">
            <button (click)="currentStep = 'details'" class="btn-secondary flex-1 py-3 text-sm">
              <app-icon name="arrow-left" [size]="15"></app-icon>
              Back
            </button>
            <button (click)="confirmBooking()"
                    [disabled]="bookingLoading"
                    class="btn-primary flex-[2] py-3 text-sm">
              @if (bookingLoading) {
                <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing…
              } @else {
                <app-icon name="shield-check" [size]="16"></app-icon>
                {{ paymentMode === 'CASH' ? 'Confirm & Book' : 'Book & Pay via Razorpay' }}
              }
            </button>
          </div>
        }

        <!-- ─── STEP 3: Confirmation ─── -->
        @if (currentStep === 'confirmation') {
          <div class="card text-center py-10">
            <div class="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <app-icon name="check-circle" [size]="28" class="text-emerald-600"></app-icon>
            </div>
            <h2 class="font-serif text-2xl text-navy-800 mb-2">Appointment Confirmed</h2>
            <p class="text-slate-500 text-sm mb-6">
              Your appointment has been booked and
              {{ bookedPayment?.mode === 'CASH' ? 'payment is pending collection at the clinic.' : 'payment has been recorded.' }}
            </p>

            @if (bookedPayment) {
              <div class="bg-slate-50 rounded-xl p-4 text-left space-y-2.5 text-sm mb-6 border border-slate-100">
                <div class="flex justify-between">
                  <span class="text-slate-500">Appointment Date</span>
                  <span class="font-medium">{{ date | formatDate }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Time</span>
                  <span class="font-medium">{{ startTime | formatTime }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Payment Mode</span>
                  <span class="font-medium">{{ bookedPayment.mode }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Payment Status</span>
                  <span class="font-semibold"
                        [ngClass]="bookedPayment.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'">
                    {{ bookedPayment.status }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Amount</span>
                  <span class="font-bold text-navy-700">₹{{ bookedPayment.amount }}</span>
                </div>
                @if (bookedPayment.transactionId && bookedPayment.mode !== 'CASH') {
                  <div class="flex justify-between">
                    <span class="text-slate-500">Transaction ID</span>
                    <span class="font-mono text-xs text-slate-600">{{ bookedPayment.transactionId }}</span>
                  </div>
                }
              </div>
            }

            <div class="flex flex-col gap-2.5">
              <button (click)="router.navigate(['/patient/appointments'])" class="btn-primary w-full">
                <app-icon name="calendar" [size]="16"></app-icon>
                View My Appointments
              </button>
              @if (bookedPayment?.status === 'PAID') {
                <button (click)="downloadInvoice()" class="btn-secondary w-full text-sm">
                  <app-icon name="download" [size]="15"></app-icon>
                  Download Invoice
                </button>
              }
            </div>
          </div>
        }

      </div>
    </app-sidebar-layout>
  `
})
export class PatientBookComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private apptService = inject(AppointmentService);
  private paymentService = inject(PaymentService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  steps = [
    { key: 'details',      label: 'Details' },
    { key: 'payment',      label: 'Payment' },
    { key: 'confirmation', label: 'Confirmed' },
  ] as const;

  paymentModes = [
    { value: 'UPI'    as PaymentMode, label: 'UPI',    icon: 'phone' },
    { value: 'CARD'   as PaymentMode, label: 'Card',   icon: 'dollar-sign' },
    { value: 'WALLET' as PaymentMode, label: 'Wallet', icon: 'shield' },
    { value: 'CASH'   as PaymentMode, label: 'Cash',   icon: 'activity' },
  ];

  // Route params
  providerId = '';
  slotId = '';
  date = '';
  startTime = '';
  endTime = '';
  consultationFee = 0;

  // Step state
  currentStep: BookingStep = 'details';
  serviceType = '';
  mode: 'IN_PERSON' | 'VIDEO' = 'IN_PERSON';
  notes = '';
  paymentMode: PaymentMode = 'UPI';
  stepError = '';
  bookingLoading = false;

  // Results
  bookedAppointment: AppointmentResponse | null = null;
  bookedPayment: import('../../core/payment.models').PaymentResponse | null = null;

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap;
    this.providerId      = p.get('providerId')  || '';
    this.slotId          = p.get('slotId')       || '';
    this.date            = p.get('date')         || '';
    this.startTime       = p.get('startTime')    || '';
    this.endTime         = p.get('endTime')      || '';
    this.serviceType     = p.get('serviceType')  || '';
    this.mode            = (p.get('mode') as 'IN_PERSON' | 'VIDEO') || 'IN_PERSON';
    this.notes           = p.get('notes')        || '';
    this.consultationFee = Number(p.get('fee'))  || 0;
  }

  isStepDone(key: string): boolean {
    const order = ['details', 'payment', 'confirmation'];
    return order.indexOf(key) < order.indexOf(this.currentStep);
  }

  goToPayment(): void {
    if (!this.serviceType.trim()) { this.stepError = 'Service type is required.'; return; }
    this.stepError = '';
    this.currentStep = 'payment';
  }

  confirmBooking(): void {
    this.stepError = '';
    this.bookingLoading = true;

    const patientId = this.auth.currentUser()!.userId;

    // Step A: Book the appointment first
    this.apptService.book({
      patientId:          Number(patientId),
      providerId:         Number(this.providerId),
      slotId:             Number(this.slotId),
      serviceType:        this.serviceType,
      modeOfConsultation: this.mode,
      notes:              this.notes || undefined,
    }).subscribe({
      next: (appt) => {
        this.bookedAppointment = appt;

        if (this.paymentMode === 'CASH') {
          // CASH: use the existing /process endpoint — no Razorpay involved
          this.paymentService.processPayment({
            appointmentId: Number(appt.appointmentId),
            patientId:     Number(patientId),
            providerId:    Number(this.providerId),
            amount:        this.consultationFee,
            mode:          'CASH',
            notes:         `Cash payment for appointment on ${this.date}`,
          }).subscribe({
            next: (payment) => {
              this.bookedPayment  = payment;
              this.bookingLoading = false;
              this.currentStep    = 'confirmation';
              this.toast.success('Appointment booked! Pay cash at the clinic.');
            },
            error: () => {
              this.bookingLoading = false;
              this.currentStep    = 'confirmation';
              this.toast.warning('Appointment booked, but payment recording failed. Contact support.');
            }
          });
        } else {
          // ONLINE (UPI / CARD / WALLET): Razorpay checkout flow
          this.paymentService.createRazorpayOrder({
            appointmentId: Number(appt.appointmentId),
            patientId:     Number(patientId),
            providerId:    Number(this.providerId),
            amount:        this.consultationFee,
            notes:         `Payment for appointment on ${this.date}`,
          }).subscribe({
            next: (order) => {
              this.bookingLoading = false;
              this.openRazorpayCheckout(order, Number(appt.appointmentId), Number(patientId));
            },
            error: (err) => {
              this.bookingLoading = false;
              this.stepError = err.error?.error || 'Could not initiate payment. Please try again.';
            }
          });
        }
      },
      error: (err) => {
        this.bookingLoading = false;
        this.stepError = err.error?.error || 'Booking failed. Please try again.';
      }
    });
  }

  /**
   * Opens the Razorpay checkout popup.
   * On success, sends the three Razorpay tokens to the backend for
   * signature verification before marking the payment as PAID.
   */
  private openRazorpayCheckout(
    order: import('../../core/payment.models').RazorpayOrderResponse,
    appointmentId: number,
    patientId: number
  ): void {

    const options = {
      key:         order.keyId,
      amount:      order.amountPaise,
      currency:    order.currency,
      name:        'MediBook',
      description: `Consultation fee — Appointment #${appointmentId}`,
      order_id:    order.orderId,

      // ── Called by Razorpay after a successful payment ──────────────────
      handler: (response: RazorpayHandlerResponse) => {
        this.bookingLoading = true;

        this.paymentService.verifyRazorpayPayment({
          razorpayOrderId:   response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          appointmentId,
          patientId,
          providerId:  Number(this.providerId),
          amount:      this.consultationFee,
          mode:        this.paymentMode,
          notes:       `Razorpay payment for appointment on ${this.date}`,
        }).subscribe({
          next: (payment) => {
            this.bookedPayment  = payment;
            this.bookingLoading = false;
            this.currentStep    = 'confirmation';
            this.toast.success('Appointment booked and payment successful!');
          },
          error: (err) => {
            this.bookingLoading = false;
            // Appointment is booked but verification failed — rare edge case.
            this.stepError = err.error?.error
              || 'Payment could not be verified. Please contact support with your payment ID: '
              + response.razorpay_payment_id;
          }
        });
      },

      // ── Called when the user closes the popup without paying ──────────
      modal: {
        ondismiss: () => {
          this.stepError = 'Payment was cancelled. Your appointment has been booked but is unpaid. Please retry payment.';
        }
      },

      prefill: {
        // Prefill is cosmetic — Razorpay still validates on their end
        contact: '',
        email:   '',
      },

      theme: {
        color: '#1e3a5f', // navy-700 to match the app
      },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  downloadInvoice(): void {
    if (!this.bookedAppointment) return;
    this.paymentService.getInvoice(Number(this.bookedAppointment.appointmentId)).subscribe({
      next: (invoice) => {
        const json = JSON.stringify(invoice, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `${invoice.invoiceNumber}.json`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Could not fetch invoice.')
    });
  }
}