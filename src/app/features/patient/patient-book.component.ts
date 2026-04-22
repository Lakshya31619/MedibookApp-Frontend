import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { ToastService } from '../../core/services/toast.service';
import { FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-patient-book',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="max-w-xl mx-auto page-enter">
        <div class="mb-6">
          <button (click)="location.back()" class="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
            ← Back
          </button>
          <h1 class="text-3xl font-serif text-navy-700">Confirm Booking</h1>
        </div>

        <div class="card mb-6">
          <h2 class="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">Appointment Summary</h2>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Date</span>
              <span class="font-medium">{{ date | formatDate }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Time</span>
              <span class="font-medium">{{ startTime | formatTime }} – {{ endTime | formatTime }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Mode</span>
              <span class="font-medium">{{ mode === 'VIDEO' ? '📹 Video Call' : '🏥 In-Person' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Service</span>
              <span class="font-medium">{{ serviceType }}</span>
            </div>
          </div>
        </div>

        <div class="card mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
          <input type="text" [(ngModel)]="serviceType" class="input-field mb-4" placeholder="e.g. General Consultation">

          <label class="block text-sm font-medium text-gray-700 mb-1">Mode of Consultation</label>
          <div class="grid grid-cols-2 gap-3 mb-4">
            <button type="button" (click)="mode = 'IN_PERSON'"
              class="py-3 rounded-xl border-2 text-sm font-medium transition-all"
              [ngClass]="mode === 'IN_PERSON' ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600'">
              🏥 In-Person
            </button>
            <button type="button" (click)="mode = 'VIDEO'"
              class="py-3 rounded-xl border-2 text-sm font-medium transition-all"
              [ngClass]="mode === 'VIDEO' ? 'border-navy-700 bg-navy-50 text-navy-700' : 'border-gray-200 text-gray-600'">
              📹 Video Call
            </button>
          </div>

          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea [(ngModel)]="notes" rows="4" class="input-field resize-none"
            placeholder="Describe your symptoms or any specific concerns…"></textarea>
        </div>

        @if (error) {
          <div class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{{ error }}</div>
        }

        <button (click)="book()" [disabled]="!serviceType.trim() || loading" class="btn-primary w-full py-3 text-base">
          {{ loading ? 'Booking…' : 'Confirm Appointment' }}
        </button>
      </div>
    </app-sidebar-layout>
  `
})
export class PatientBookComponent implements OnInit {
  router = inject(Router);
  location = inject(Location);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private apptService = inject(AppointmentService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', iconName: 'info', route: '/patient/dashboard' },
    { label: 'Find Doctors', iconName: 'user', route: '/patient/browse' },
    { label: 'My Appointments', iconName: 'calendar', route: '/patient/appointments' },
    { label: 'Profile', iconName: 'user', route: '/patient/profile' },
  ];

  providerId = '';
  slotId = '';
  date = '';
  startTime = '';
  endTime = '';
  serviceType = '';
  mode: 'IN_PERSON' | 'VIDEO' = 'IN_PERSON';
  notes = '';
  loading = false;
  error = '';

  ngOnInit(): void {
    const p = this.route.snapshot.queryParamMap;
    this.providerId = p.get('providerId') || '';
    this.slotId = p.get('slotId') || '';
    this.date = p.get('date') || '';
    this.startTime = p.get('startTime') || '';
    this.endTime = p.get('endTime') || '';
    this.serviceType = p.get('serviceType') || '';
    this.mode = (p.get('mode') as 'IN_PERSON' | 'VIDEO') || 'IN_PERSON';
    this.notes = p.get('notes') || '';
  }

  book(): void {
    this.loading = true;
    this.error = '';
    const patientId = this.auth.currentUser()!.userId;
    this.apptService.book({ patientId, providerId: this.providerId, slotId: this.slotId, serviceType: this.serviceType, modeOfConsultation: this.mode, notes: this.notes || undefined }).subscribe({
      next: () => {
        this.loading = false;
        this.toast.success('Appointment booked successfully!');
        this.router.navigate(['/patient/appointments']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Booking failed. Please try again.';
      }
    });
  }
}
