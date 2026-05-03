import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { NavigationService } from '../../core/services/navigation.service';
import { RecordService } from '../../core/services/record.service';
import { ToastService } from '../../core/services/toast.service';
import { RecordResponse } from '../../core/record.models';

type AdminTab = 'all' | 'followup';

@Component({
  selector: 'app-admin-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, IconComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="page-title">Medical Records</h1>
            <p class="page-subtitle">Platform-wide records and follow-up management</p>
          </div>
          <button (click)="triggerFollowUpJob()" [disabled]="triggering"
                  class="btn-secondary text-sm">
            <app-icon name="refresh-cw" [size]="15"></app-icon>
            @if (triggering) { Processing... } @else { Run Follow-up Job }
          </button>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-slate-900">{{ allRecords.length }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Total Records</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-amber-600">{{ followUpRecords.length }}</p>
            <p class="text-xs text-slate-500 mt-0.5">With Follow-up</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-green-600">{{ attachedCount }}</p>
            <p class="text-xs text-slate-500 mt-0.5">With Attachments</p>
          </div>
          <div class="card text-center py-4">
            <p class="text-2xl font-bold text-blue-600">{{ editableCount }}</p>
            <p class="text-xs text-slate-500 mt-0.5">Still Editable</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5 w-fit">
          <button (click)="tab = 'all'; loadAll()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'all' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            All Records ({{ allRecords.length }})
          </button>
          <button (click)="tab = 'followup'; loadFollowUp()" class="px-5 py-2 rounded-lg text-sm font-medium transition-all"
            [ngClass]="tab === 'followup' ? 'bg-white text-navy-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
            Follow-up ({{ followUpRecords.length }})
          </button>
        </div>

        <!-- Search -->
        <div class="relative mb-4">
          <app-icon name="search" [size]="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></app-icon>
          <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()"
                 class="input pl-9 w-full sm:w-72" placeholder="Search by diagnosis or patient ID...">
        </div>

        <!-- Loading -->
        @if (loading) {
          <div class="space-y-2">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="card animate-pulse h-16"></div>
            }
          </div>
        }

        <!-- Table -->
        @if (!loading) {
          <div class="card p-0 overflow-hidden">
            <div class="overflow-x-auto">
              <table class="w-full text-sm min-w-[720px]">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">ID</th>
                    <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Patient</th>
                    <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Provider</th>
                    <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Diagnosis</th>
                    <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Follow-up</th>
                    <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Created</th>
                    <th class="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (record of filtered; track record.recordId) {
                    <tr class="hover:bg-slate-50 transition-colors">
                      <td class="px-5 py-3 text-slate-500 font-mono text-xs">#{{ record.recordId }}</td>
                      <td class="px-5 py-3 font-medium text-slate-800">
                        #{{ record.patientId }}
                        <span class="text-xs text-slate-400 ml-1">(Appt #{{ record.appointmentId }})</span>
                      </td>
                      <td class="px-5 py-3 text-slate-600">#{{ record.providerId }}</td>
                      <td class="px-5 py-3 max-w-[180px]">
                        <p class="truncate text-slate-700">{{ record.diagnosis }}</p>
                      </td>
                      <td class="px-5 py-3">
                        @if (record.followUpDate) {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                            {{ record.followUpDate | date:'mediumDate' }}
                            @if (record.followUpReminderSent) {
                              <app-icon name="check" [size]="10" class="text-green-600 ml-0.5"></app-icon>
                            }
                          </span>
                        } @else {
                          <span class="text-slate-400 text-xs">—</span>
                        }
                      </td>
                      <td class="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {{ record.createdAt | date:'mediumDate' }}
                      </td>
                      <td class="px-5 py-3 text-right">
                        <div class="flex items-center justify-end gap-1">
                          <button (click)="openView(record)"
                                  class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                                  title="View">
                            <app-icon name="eye" [size]="14"></app-icon>
                          </button>
                          <button (click)="confirmDelete(record)"
                                  class="p-1.5 rounded-lg hover:bg-red-50 text-red-400"
                                  title="Delete">
                            <app-icon name="trash-2" [size]="14"></app-icon>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                  @if (filtered.length === 0) {
                    <tr>
                      <td colspan="7" class="px-5 py-12 text-center text-slate-400 text-sm">
                        No records found.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }


        <!-- ── VIEW MODAL ──────────────────────────────────────────────── -->
        @if (viewRecord) {
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16"
               (click)="viewRecord = null">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                 (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <h2 class="text-lg font-semibold text-slate-900">Record #{{ viewRecord.recordId }}</h2>
                <button (click)="viewRecord = null" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <app-icon name="x" [size]="18"></app-icon>
                </button>
              </div>
              <div class="px-6 py-5 space-y-4 text-sm">
                <div class="grid grid-cols-2 gap-3">
                  <div><p class="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Patient</p><p>#{{ viewRecord.patientId }}</p></div>
                  <div><p class="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Provider</p><p>#{{ viewRecord.providerId }}</p></div>
                  <div><p class="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Appointment</p><p>#{{ viewRecord.appointmentId }}</p></div>
                  <div><p class="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Editable</p>
                    <span [class]="viewRecord.editable ? 'text-green-600 text-xs' : 'text-slate-400 text-xs'">
                      {{ viewRecord.editable ? 'Yes (within 48h)' : 'Locked' }}
                    </span>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Diagnosis</p>
                  <p class="bg-slate-50 rounded-lg p-3 leading-relaxed text-slate-800">{{ viewRecord.diagnosis }}</p>
                </div>
                @if (viewRecord.prescription) {
                  <div>
                    <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Prescription</p>
                    <p class="bg-green-50 rounded-lg p-3 leading-relaxed text-slate-800">{{ viewRecord.prescription }}</p>
                  </div>
                }
                @if (viewRecord.notes) {
                  <div>
                    <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                    <p class="bg-slate-50 rounded-lg p-3 leading-relaxed text-slate-800">{{ viewRecord.notes }}</p>
                  </div>
                }
                @if (viewRecord.followUpDate) {
                  <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <app-icon name="calendar" [size]="16" class="text-amber-600"></app-icon>
                    <div>
                      <p class="text-xs font-semibold text-amber-800">Follow-up: {{ viewRecord.followUpDate | date:'fullDate' }}</p>
                      <p class="text-xs text-amber-600">Reminder {{ viewRecord.followUpReminderSent ? 'sent ✓' : 'pending' }}</p>
                    </div>
                  </div>
                }
                @if (viewRecord.attachmentUrl) {
                  <div>
                    <p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Attachment</p>
                    <a [href]="viewRecord.attachmentUrl" target="_blank"
                       class="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                      <app-icon name="paperclip" [size]="14"></app-icon> View Document
                    </a>
                  </div>
                }
                <p class="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Created: {{ viewRecord.createdAt | date:'medium' }} ·
                  Updated: {{ viewRecord.updatedAt | date:'medium' }}
                </p>
              </div>
            </div>
          </div>
        }


        <!-- ── DELETE CONFIRM ─────────────────────────────────────────── -->
        @if (deleteTarget) {
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
               (click)="deleteTarget = null">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
                 (click)="$event.stopPropagation()">
              <div class="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mb-3">
                <app-icon name="trash-2" [size]="18" class="text-red-600"></app-icon>
              </div>
              <h3 class="font-semibold text-slate-900 mb-1">Delete Record #{{ deleteTarget.recordId }}?</h3>
              <p class="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
              <div class="flex gap-3">
                <button (click)="deleteTarget = null" class="btn-secondary flex-1">Cancel</button>
                <button (click)="submitDelete()" [disabled]="deleting" class="btn-danger flex-1">
                  @if (deleting) { Deleting... } @else { Delete }
                </button>
              </div>
            </div>
          </div>
        }

      </div>
    </app-sidebar-layout>
  `
})
export class AdminRecordsComponent implements OnInit {
  private navigationService = inject(NavigationService);
  private recordService = inject(RecordService);
  private toast = inject(ToastService);

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  tab: AdminTab = 'all';
  loading = true;
  triggering = false;
  deleting = false;

  allRecords: RecordResponse[] = [];
  followUpRecords: RecordResponse[] = [];
  filtered: RecordResponse[] = [];
  searchQuery = '';

  viewRecord: RecordResponse | null = null;
  deleteTarget: RecordResponse | null = null;

  get attachedCount(): number { return this.allRecords.filter(r => r.attachmentUrl).length; }
  get editableCount(): number { return this.allRecords.filter(r => r.editable).length; }

  ngOnInit(): void {
    this.loadAll();
    this.loadFollowUp();
  }

  loadAll(): void {
    this.loading = true;
    this.recordService.getAll().subscribe({
      next: (data) => {
        this.allRecords = data;
        if (this.tab === 'all') { this.filtered = data; this.applyFilter(); }
        this.loading = false;
      },
      error: () => { this.toast.error('Failed to load records'); this.loading = false; }
    });
  }

  loadFollowUp(): void {
    this.recordService.getAllWithFollowUp().subscribe({
      next: (data) => {
        this.followUpRecords = data;
        if (this.tab === 'followup') { this.filtered = data; this.applyFilter(); }
      },
      error: () => {}
    });
  }

  applyFilter(): void {
    const source = this.tab === 'all' ? this.allRecords : this.followUpRecords;
    const q = this.searchQuery.toLowerCase().trim();
    this.filtered = q
      ? source.filter(r =>
          r.diagnosis.toLowerCase().includes(q) ||
          String(r.patientId).includes(q) ||
          String(r.recordId).includes(q)
        )
      : source;
  }

  openView(record: RecordResponse): void { this.viewRecord = record; }
  confirmDelete(record: RecordResponse): void { this.deleteTarget = record; }

  submitDelete(): void {
    if (!this.deleteTarget) return;
    this.deleting = true;
    this.recordService.deleteRecord(this.deleteTarget.recordId).subscribe({
      next: () => {
        const id = this.deleteTarget!.recordId;
        this.allRecords = this.allRecords.filter(r => r.recordId !== id);
        this.followUpRecords = this.followUpRecords.filter(r => r.recordId !== id);
        this.applyFilter();
        this.toast.success('Record deleted.');
        this.deleteTarget = null;
        this.deleting = false;
      },
      error: () => { this.toast.error('Failed to delete.'); this.deleting = false; }
    });
  }

  triggerFollowUpJob(): void {
    this.triggering = true;
    this.recordService.processFollowUpReminders().subscribe({
      next: (res) => {
        this.toast.success(`Follow-up job complete. Sent ${res.sent ?? 0} reminder(s).`);
        this.loadFollowUp();
        this.triggering = false;
      },
      error: () => { this.toast.error('Follow-up job failed.'); this.triggering = false; }
    });
  }
}