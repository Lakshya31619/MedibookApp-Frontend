import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { ScheduleService } from '../../core/services/schedule.service';
import { ToastService } from '../../core/services/toast.service';
import { SlotResponse } from '../../core/models';
import { FormatTimePipe, FormatDatePipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-provider-slots',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarLayoutComponent, FormatTimePipe, FormatDatePipe],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">
        <h1 class="text-3xl font-serif text-navy-700 mb-6">Slot Management</h1>

        @if (!providerId) {
          <div class="card text-center py-12">
            <div class="text-4xl mb-3">🔒</div>
            <p class="text-gray-500">Your profile must be verified before managing slots.</p>
          </div>
        }

        @if (providerId) {
          <!-- Tabs -->
          <div class="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
            @for (t of tabs; track t.key) {
              <button (click)="tab = t.key" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
                [ngClass]="tab === t.key ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
                {{ t.label }}
              </button>
            }
          </div>

          <!-- Single slot -->
          @if (tab === 'single') {
            <div class="card max-w-lg mb-6">
              <h2 class="font-semibold text-gray-700 mb-4">Add Single Slot</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" [(ngModel)]="single.date" class="input-field">
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" [(ngModel)]="single.startTime" class="input-field">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" [(ngModel)]="single.endTime" class="input-field">
                  </div>
                </div>
                <button (click)="addSingle()" [disabled]="!single.date || !single.startTime || !single.endTime || saving"
                  class="btn-primary w-full">{{ saving ? 'Adding…' : 'Add Slot' }}</button>
              </div>
            </div>
          }

          <!-- Recurring slot -->
          @if (tab === 'recurring') {
            <div class="card max-w-lg mb-6">
              <h2 class="font-semibold text-gray-700 mb-4">Add Recurring Slots</h2>
              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" [(ngModel)]="recurring.startDate" class="input-field">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" [(ngModel)]="recurring.endDate" class="input-field">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input type="time" [(ngModel)]="recurring.startTime" class="input-field">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input type="time" [(ngModel)]="recurring.endTime" class="input-field">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Slot Duration (min)</label>
                    <input type="number" [(ngModel)]="recurring.slotDurationMinutes" class="input-field" min="15">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
                    <select [(ngModel)]="recurring.recurrenceType" class="input-field">
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="WEEKDAYS">Weekdays</option>
                    </select>
                  </div>
                </div>
                <button (click)="addRecurring()" [disabled]="saving" class="btn-primary w-full">
                  {{ saving ? 'Creating…' : 'Create Recurring Slots' }}
                </button>
              </div>
            </div>
          }

          <!-- View slots -->
          @if (tab === 'view') {
            <div class="card">
              <div class="flex items-center justify-between mb-4">
                <h2 class="font-semibold text-gray-700">Your Slots</h2>
                <button (click)="loadSlots()" class="text-sm text-emerald-600 hover:underline">Refresh</button>
              </div>
              @if (slotsLoading) {
                <div class="space-y-2">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                  }
                </div>
              }
              @if (!slotsLoading && slots.length === 0) {
                <p class="text-center text-gray-400 py-8">No slots found.</p>
              }
              @if (!slotsLoading) {
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="border-b border-gray-100">
                        <th class="text-left py-2 text-gray-500 font-medium">Date</th>
                        <th class="text-left py-2 text-gray-500 font-medium">Time</th>
                        <th class="text-left py-2 text-gray-500 font-medium">Status</th>
                        <th class="text-left py-2 text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                      @for (slot of slots; track slot.slotId) {
                        <tr>
                          <td class="py-3">{{ slot.date | formatDate }}</td>
                          <td class="py-3">{{ slot.startTime | formatTime }} – {{ slot.endTime | formatTime }}</td>
                          <td class="py-3">
                            @if (slot.isBooked) { <span class="badge-scheduled">Booked</span> }
                            @else if (slot.isBlocked) { <span class="badge-cancelled">Blocked</span> }
                            @else { <span class="badge-approved">Available</span> }
                          </td>
                          <td class="py-3">
                            @if (!slot.isBooked) {
                              @if (!slot.isBlocked) {
                                <button (click)="blockSlot(slot)" class="text-xs text-amber-600 hover:underline mr-3">Block</button>
                              } @else {
                                <button (click)="unblockSlot(slot)" class="text-xs text-emerald-600 hover:underline mr-3">Unblock</button>
                              }
                              <button (click)="deleteSlot(slot)" class="text-xs text-red-500 hover:underline">Delete</button>
                            }
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          }
        }
      </div>
    </app-sidebar-layout>
  `
})
export class ProviderSlotsComponent implements OnInit {
  private auth = inject(AuthService);
  private providerService = inject(ProviderService);
  private scheduleService = inject(ScheduleService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '🏠', route: '/provider/dashboard' },
    { label: 'Appointments', icon: '📅', route: '/provider/appointments' },
    { label: 'Slot Management', icon: '🗓️', route: '/provider/slots' },
    { label: 'My Profile', icon: '👤', route: '/provider/profile' },
  ];

  tabs = [
    { key: 'single', label: 'Single Slot' },
    { key: 'recurring', label: 'Recurring' },
    { key: 'view', label: 'View Slots' },
  ];
  tab = 'single';
  providerId = '';
  slots: SlotResponse[] = [];
  slotsLoading = false;
  saving = false;

  single = { date: '', startTime: '', endTime: '' };
  recurring = {
    startDate: '', endDate: '', startTime: '', endTime: '',
    slotDurationMinutes: 30, recurrenceType: 'WEEKDAYS' as 'DAILY' | 'WEEKLY' | 'WEEKDAYS'
  };

  ngOnInit(): void {
    const userId = this.auth.currentUser()!.userId;
    this.providerService.getMyProfile(userId).subscribe({
      next: (p) => {
        if (p.verificationStatus === 'APPROVED') {
          this.providerId = p.providerId;
          this.loadSlots();
        }
      }
    });
  }

  loadSlots(): void {
    if (!this.providerId) return;
    this.slotsLoading = true;
    this.scheduleService.getProviderSlots(this.providerId).subscribe({
      next: (s) => { this.slots = s; this.slotsLoading = false; },
      error: () => { this.slotsLoading = false; }
    });
  }

  addSingle(): void {
    this.saving = true;
    this.scheduleService.addSlot({ providerId: this.providerId, ...this.single }).subscribe({
      next: (s) => {
        this.saving = false;
        this.slots.push(s);
        this.toast.success('Slot added!');
        this.single = { date: '', startTime: '', endTime: '' };
      },
      error: () => { this.saving = false; this.toast.error('Failed to add slot.'); }
    });
  }

  addRecurring(): void {
    this.saving = true;
    this.scheduleService.addRecurringSlots({ providerId: this.providerId, ...this.recurring }).subscribe({
      next: (res) => {
        this.saving = false;
        this.toast.success(`${res.slotsCreated} slots created (${res.slotsSkipped} skipped).`);
        this.loadSlots();
      },
      error: () => { this.saving = false; this.toast.error('Failed to create slots.'); }
    });
  }

  blockSlot(slot: SlotResponse): void {
    this.scheduleService.blockSlot(slot.slotId).subscribe({
      next: (s) => { const idx = this.slots.findIndex(x => x.slotId === s.slotId); if (idx !== -1) this.slots[idx] = s; this.toast.success('Slot blocked.'); },
      error: () => this.toast.error('Failed.')
    });
  }

  unblockSlot(slot: SlotResponse): void {
    this.scheduleService.unblockSlot(slot.slotId).subscribe({
      next: (s) => { const idx = this.slots.findIndex(x => x.slotId === s.slotId); if (idx !== -1) this.slots[idx] = s; this.toast.success('Slot unblocked.'); },
      error: () => this.toast.error('Failed.')
    });
  }

  deleteSlot(slot: SlotResponse): void {
    this.scheduleService.deleteSlot(slot.slotId).subscribe({
      next: () => { this.slots = this.slots.filter(s => s.slotId !== slot.slotId); this.toast.success('Slot deleted.'); },
      error: () => this.toast.error('Failed.')
    });
  }
}
