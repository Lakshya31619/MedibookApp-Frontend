import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { IconComponent } from '../../shared/components/icon.component';
import { ProviderService } from '../../core/services/provider.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { AuthService } from '../../core/services/auth.service';
import { ProviderResponse, SlotSummary } from '../../core/models';
import { FormatTimePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, IconComponent, FormatTimePipe],
  template: `
    <app-navbar></app-navbar>

    @if (loading) {
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="w-10 h-10 border-4 border-navy-200 border-t-navy-700 rounded-full animate-spin"></div>
      </div>
    }

    @if (!loading && provider) {
      <div class="max-w-5xl mx-auto px-4 py-8 page-enter">
        <!-- Header card -->
        <div class="card mb-6 flex flex-col md:flex-row gap-6">
          <div class="w-24 h-24 rounded-2xl bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-3xl flex-shrink-0 overflow-hidden">
            @if (provider.profilePicUrl) {
              <img [src]="provider.profilePicUrl" class="w-full h-full object-cover" alt="">
            } @else {
              {{ (provider.specialization || '?')[0] }}
            }
          </div>
          <div class="flex-1">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl font-serif text-navy-700 mb-1">Dr. {{ provider.providerName || 'Healthcare Provider' }}</h1>
                <p class="text-emerald-600 font-medium mb-1">{{ provider.specialization }}</p>
                <p class="text-gray-500 text-sm">{{ provider.experienceYears }} years of experience</p>
              </div>
              <div class="text-right">
                @if (provider.consultationFee) {
                  <p class="text-2xl font-bold text-navy-700">₹{{ provider.consultationFee }}</p>
                  <p class="text-gray-400 text-sm">Consultation fee</p>
                }
              </div>
            </div>
            @if (provider.bio) {
              <p class="text-gray-600 text-sm mt-3 leading-relaxed">{{ provider.bio }}</p>
            }
            <div class="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
              @if (provider.clinicName) { 
                <span class="flex items-center gap-1.5">
                  <app-icon name="hospital" class="w-4 h-4 text-emerald-600"></app-icon>
                  {{ provider.clinicName }}
                </span> 
              }
              @if (provider.clinicAddress) { 
                <span class="flex items-center gap-1.5">
                  <app-icon name="info" class="w-4 h-4 text-emerald-600"></app-icon>
                  {{ provider.clinicAddress }}
                </span> 
              }
              @if (provider.avgRating) { <span>★ {{ provider.avgRating.toFixed(1) }}</span> }
              <span [ngClass]="provider.available ? 'text-emerald-600 font-medium flex items-center gap-1.5' : 'text-red-500 flex items-center gap-1.5'">
                @if (provider.available) {
                  <app-icon name="check-circle" class="w-4 h-4"></app-icon>
                  Available
                } @else {
                  <app-icon name="x-circle" class="w-4 h-4"></app-icon>
                  Not Available
                }
              </span>
            </div>
          </div>
        </div>

        <!-- Slot picker -->
        <div class="card">
          <h2 class="text-xl font-serif text-navy-700 mb-5">Book an Appointment</h2>

          <!-- 14-day date strip -->
          <div class="flex gap-2 overflow-x-auto pb-2 mb-6">
            @for (day of dateStrip; track day.iso) {
              <button (click)="selectDate(day.iso)"
                class="flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[60px]"
                [ngClass]="selectedDate === day.iso ? 'border-navy-700 bg-navy-700 text-white' : 'border-gray-200 text-gray-600 hover:border-navy-300'">
                <span class="text-xs font-medium">{{ day.dayName }}</span>
                <span class="text-lg font-bold">{{ day.day }}</span>
                <span class="text-xs opacity-70">{{ day.month }}</span>
              </button>
            }
          </div>

          @if (slotsLoading) {
            <div class="text-center py-8 text-gray-400">Loading slots…</div>
          }

          @if (!slotsLoading && slots.length === 0 && selectedDate) {
            <div class="text-center py-8 text-gray-400">
              <div class="flex justify-center mb-2">
                <app-icon name="calendar" class="w-8 h-8"></app-icon>
              </div>
              <p>No available slots for this date.</p>
            </div>
          }

          @if (!slotsLoading && slots.length > 0) {
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
              @for (slot of slots; track slot.slotId) {
                <button (click)="selectedSlot = slot"
                  class="py-2 px-3 rounded-lg text-sm border-2 transition-all text-center"
                  [ngClass]="selectedSlot?.slotId === slot.slotId ? 'border-navy-700 bg-navy-700 text-white' : 'border-gray-200 text-gray-700 hover:border-navy-300'">
                  {{ slot.startTime | formatTime }}
                </button>
              }
            </div>

            @if (selectedSlot) {
              <div class="border-t border-gray-100 pt-5">
                <h3 class="font-semibold text-gray-700 mb-3">Appointment Details</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                    <input type="text" [(ngModel)]="serviceType" class="input-field" placeholder="e.g. General Consultation">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                    <select [(ngModel)]="mode" class="input-field">
                      <option value="IN_PERSON">In Person</option>
                      <option value="VIDEO">Video Call</option>
                    </select>
                  </div>
                </div>
                <div class="mb-5">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea [(ngModel)]="notes" rows="3" class="input-field resize-none" placeholder="Describe your symptoms or concerns…"></textarea>
                </div>

                <div class="bg-navy-50 rounded-xl p-4 mb-5 flex items-center justify-between">
                  <div class="text-sm text-gray-600">
                    <p class="font-semibold text-gray-900">Appointment Summary</p>
                    <p>{{ selectedDate | date:'EEE, MMM d' }} · {{ selectedSlot.startTime | formatTime }} – {{ selectedSlot.endTime | formatTime }}</p>
                  </div>
                  @if (provider.consultationFee) {
                    <p class="text-navy-700 font-bold">₹{{ provider.consultationFee }}</p>
                  }
                </div>

                <button (click)="bookAppointment()" [disabled]="!serviceType || booking"
                  class="btn-primary w-full text-base py-3">
                  {{ booking ? 'Booking…' : 'Confirm Appointment' }}
                </button>
              </div>
            }
          }
        </div>
      </div>
    }
  `
})
export class ProviderDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private providerService = inject(ProviderService);
  private scheduleService = inject(ScheduleService);
  private auth = inject(AuthService);

  provider: ProviderResponse | null = null;
  loading = true;
  slots: SlotSummary[] = [];
  slotsLoading = false;
  selectedDate = '';
  selectedSlot: SlotSummary | null = null;
  serviceType = '';
  mode: 'IN_PERSON' | 'VIDEO' = 'IN_PERSON';
  notes = '';
  booking = false;
  dateStrip: { iso: string; day: number; month: string; dayName: string }[] = [];

  ngOnInit(): void {
    this.buildDateStrip();
    const id = this.route.snapshot.paramMap.get('id')!;
    this.providerService.getById(id).subscribe({
      next: (p) => { this.provider = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  buildDateStrip(): void {
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      this.dateStrip.push({
        iso: d.toISOString().split('T')[0],
        day: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        dayName: d.toLocaleString('default', { weekday: 'short' }),
      });
    }
  }

  selectDate(date: string): void {
    this.selectedDate = date;
    this.selectedSlot = null;
    this.slotsLoading = true;
    this.scheduleService.getAvailableByDate(this.provider!.providerId, date).subscribe({
      next: (s) => { this.slots = s; this.slotsLoading = false; },
      error: () => { this.slotsLoading = false; }
    });
  }

  bookAppointment(): void {
    if (!this.auth.isLoggedIn()) { this.router.navigate(['/login']); return; }
    if (this.auth.role !== 'PATIENT') { return; }
    this.booking = true;
    this.router.navigate(['/patient/book'], {
      queryParams: {
        providerId: this.provider!.providerId,
        slotId: this.selectedSlot!.slotId,
        date: this.selectedDate,
        startTime: this.selectedSlot!.startTime,
        endTime: this.selectedSlot!.endTime,
        serviceType: this.serviceType,
        mode: this.mode,
        notes: this.notes,
      }
    });
  }
}