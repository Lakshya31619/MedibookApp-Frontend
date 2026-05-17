import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { AppointmentService } from '../../core/services/appointment.service';
import { RecordService } from '../../core/services/record.service';
import { ProviderService } from '../../core/services/provider.service';
import { ToastService } from '../../core/services/toast.service';
import { RecordResponse, CreateRecordRequest, UpdateRecordRequest } from '../../core/record.models';
import { AppointmentSummary } from '../../core/models';

@Component({
  selector: 'app-provider-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, IconComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="page-title">Medical Records</h1>
            <p class="page-subtitle">Create and manage patient medical records</p>
          </div>
          <button (click)="openCreate()" class="btn-primary text-sm">
            <app-icon name="plus" [size]="15"></app-icon>
            New Record
          </button>
        </div>

        <!-- Loading skeleton -->
        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3,4]; track i) {
              <div class="card animate-pulse h-24"></div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (!loading && records.length === 0) {
          <div class="card text-center py-14">
            <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <app-icon name="file-text" [size]="22" class="text-slate-400"></app-icon>
            </div>
            <p class="font-medium text-slate-600 mb-1">No records created yet</p>
            <p class="text-sm text-slate-400 mb-5">Create your first medical record after a consultation.</p>
            <button (click)="openCreate()" class="btn-primary inline-flex text-sm">Create Record</button>
          </div>
        }

        <!-- Records table -->
        @if (!loading && records.length > 0) {
          <div class="card p-0 overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Patient</th>
                  <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Diagnosis</th>
                  <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Date</th>
                  <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Follow-up</th>
                  <th class="text-left px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Attachment</th>
                  <th class="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (record of records; track record.recordId) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-5 py-3.5">
                      <span class="font-medium text-slate-800">Patient #{{ record.patientId }}</span>
                      <p class="text-xs text-slate-400">Appt #{{ record.appointmentId }}</p>
                    </td>
                    <td class="px-5 py-3.5 max-w-[200px]">
                      <p class="truncate text-slate-700">{{ record.diagnosis }}</p>
                    </td>
                    <td class="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {{ record.createdAt | date:'mediumDate' }}
                    </td>
                    <td class="px-5 py-3.5">
                      @if (record.followUpDate) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                          <app-icon name="calendar" [size]="11"></app-icon>
                          {{ record.followUpDate | date:'mediumDate' }}
                        </span>
                      } @else {
                        <span class="text-slate-400 text-xs">—</span>
                      }
                    </td>
                    <td class="px-5 py-3.5">
                      @if (record.attachmentUrl) {
                        <a [href]="record.attachmentUrl" target="_blank"
                           class="text-blue-600 hover:underline text-xs flex items-center gap-1">
                          <app-icon name="paperclip" [size]="12"></app-icon> View
                        </a>
                      } @else {
                        <button (click)="openAttach(record)"
                                class="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                          <app-icon name="upload" [size]="12"></app-icon> Attach
                        </button>
                      }
                    </td>
                    <td class="px-5 py-3.5 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button (click)="openView(record)"
                                class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                                title="View">
                          <app-icon name="eye" [size]="15"></app-icon>
                        </button>
                        @if (record.editable) {
                          <button (click)="openEdit(record)"
                                  class="p-1.5 rounded-lg hover:bg-navy-50 text-navy-600"
                                  title="Edit (within 48h)">
                            <app-icon name="pencil" [size]="15"></app-icon>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }


        <!-- ── CREATE MODAL ────────────────────────────────────────────── -->
        @if (showCreate) {
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16"
               (click)="closeCreate()">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                 (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-gray-700">
                <h2 class="text-lg font-semibold text-slate-900 dark:text-gray-100">New Medical Record</h2>
                <button (click)="closeCreate()" class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-500 dark:text-slate-400">
                  <app-icon name="x" [size]="18"></app-icon>
                </button>
              </div>
              <div class="px-6 py-5 space-y-4">
                <!-- Appointment Selector -->
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Select Appointment *</label>
                  <div class="relative">
                    <select [(ngModel)]="selectedAppointmentId" (change)="onAppointmentSelected()" 
                            class="input w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                      <option value="">-- Choose a completed appointment --</option>
                      @for (appt of completedAppointments; track appt.appointmentId) {
                        <option [value]="appt.appointmentId">{{ appt.patientId ? 'Patient #' + appt.patientId : 'Unknown Patient' }} - {{ appt.appointmentDate }} {{ appt.startTime }}</option>
                      }
                    </select>
                  </div>
                  @if (completedAppointments.length === 0 && !loadingAppointments) {
                    <p class="text-xs text-amber-600 dark:text-amber-400 mt-1">No completed appointments found.</p>
                  }
                  @if (loadingAppointments) {
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Loading appointments...</p>
                  }
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Appointment ID</label>
                    <input type="text" [value]="createForm.appointmentId || ''"
                           disabled class="input w-full bg-slate-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-not-allowed">
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Auto-filled</p>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Patient ID</label>
                    <input type="text" [value]="createForm.patientId || ''"
                           disabled class="input w-full bg-slate-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-not-allowed">
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Auto-filled</p>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Diagnosis *</label>
                  <textarea [(ngModel)]="createForm.diagnosis" rows="3"
                            class="input w-full resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                            placeholder="Enter diagnosis details..."></textarea>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Prescription</label>
                  <textarea [(ngModel)]="createForm.prescription" rows="2"
                            class="input w-full resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                            placeholder="Medications, dosage, instructions..."></textarea>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                  <textarea [(ngModel)]="createForm.notes" rows="2"
                            class="input w-full resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                            placeholder="Additional clinical notes..."></textarea>
                </div>

                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Follow-up Date</label>
                  <input type="date" [(ngModel)]="createForm.followUpDate" class="input w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                </div>

                <div class="flex gap-3 pt-1">
                  <button (click)="closeCreate()" class="btn-secondary flex-1">Cancel</button>
                  <button (click)="submitCreate()" [disabled]="creating || !selectedAppointmentId"
                          class="btn-primary flex-1">
                    @if (creating) { <span class="loading-spinner-sm"></span> }
                    Create Record
                  </button>
                </div>
              </div>
            </div>
          </div>
        }


        <!-- ── EDIT MODAL ──────────────────────────────────────────────── -->
        @if (showEdit && editingRecord) {
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
               (click)="closeEdit()">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
                 (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <div>
                  <h2 class="text-lg font-semibold text-slate-900">Edit Record</h2>
                  <p class="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                    <app-icon name="clock" [size]="12"></app-icon>
                    Editable within 48 hours of creation
                  </p>
                </div>
                <button (click)="closeEdit()" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <app-icon name="x" [size]="18"></app-icon>
                </button>
              </div>
              <div class="px-6 py-5 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Diagnosis</label>
                  <textarea [(ngModel)]="editForm.diagnosis" rows="3"
                            class="input w-full resize-none"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Prescription</label>
                  <textarea [(ngModel)]="editForm.prescription" rows="2"
                            class="input w-full resize-none"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <textarea [(ngModel)]="editForm.notes" rows="2"
                            class="input w-full resize-none"></textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Follow-up Date</label>
                  <input type="date" [(ngModel)]="editForm.followUpDate" class="input w-full">
                  <p class="text-xs text-slate-400 mt-1">Leave empty to remove follow-up date.</p>
                </div>
                <div class="flex gap-3 pt-1">
                  <button (click)="closeEdit()" class="btn-secondary flex-1">Cancel</button>
                  <button (click)="submitEdit()" [disabled]="saving"
                          class="btn-primary flex-1">
                    @if (saving) { <span class="loading-spinner-sm"></span> }
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        }


        <!-- ── ATTACH DOCUMENT MODAL ──────────────────────────────────── -->
        @if (showAttach && attachTarget) {
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
               (click)="closeAttach()">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md"
                 (click)="$event.stopPropagation()">
              <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <h2 class="text-lg font-semibold text-slate-900">Attach Document</h2>
                <button (click)="closeAttach()" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                  <app-icon name="x" [size]="18"></app-icon>
                </button>
              </div>
              <div class="px-6 py-5 space-y-4">
                <p class="text-sm text-slate-500">Paste the URL of the document to attach to record #{{ attachTarget.recordId }}.</p>
                <div>
                  <label class="block text-xs font-medium text-slate-600 mb-1">Document URL</label>
                  <input type="url" [(ngModel)]="attachUrl"
                         class="input w-full" placeholder="https://...">
                </div>
                <div class="flex gap-3 pt-1">
                  <button (click)="closeAttach()" class="btn-secondary flex-1">Cancel</button>
                  <button (click)="submitAttach()" [disabled]="attaching || !attachUrl"
                          class="btn-primary flex-1">
                    @if (attaching) { <span class="loading-spinner-sm"></span> }
                    Attach
                  </button>
                </div>
              </div>
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
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Patient</p>
                    <p class="text-slate-800">#{{ viewRecord.patientId }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Appointment</p>
                    <p class="text-slate-800">#{{ viewRecord.appointmentId }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Created</p>
                    <p class="text-slate-800">{{ viewRecord.createdAt | date:'medium' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Status</p>
                    <span [class]="viewRecord.editable ? 'text-green-600 text-xs font-medium' : 'text-slate-400 text-xs'">
                      {{ viewRecord.editable ? '✓ Editable' : '🔒 Locked' }}
                    </span>
                  </div>
                </div>
                <div>
                  <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Diagnosis</p>
                  <p class="text-slate-800 bg-slate-50 rounded-lg p-3 leading-relaxed">{{ viewRecord.diagnosis }}</p>
                </div>
                @if (viewRecord.prescription) {
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Prescription</p>
                    <p class="text-slate-800 bg-green-50 rounded-lg p-3 leading-relaxed">{{ viewRecord.prescription }}</p>
                  </div>
                }
                @if (viewRecord.notes) {
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Notes</p>
                    <p class="text-slate-800 bg-slate-50 rounded-lg p-3 leading-relaxed">{{ viewRecord.notes }}</p>
                  </div>
                }
                @if (viewRecord.followUpDate) {
                  <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <app-icon name="calendar" [size]="16" class="text-amber-600"></app-icon>
                    <span class="text-sm text-amber-800">Follow-up: {{ viewRecord.followUpDate | date:'fullDate' }}</span>
                  </div>
                }
                @if (viewRecord.attachmentUrl) {
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Attachment</p>
                    <a [href]="viewRecord.attachmentUrl" target="_blank"
                       class="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm">
                      <app-icon name="paperclip" [size]="14"></app-icon>
                      View Document
                    </a>
                  </div>
                }
              </div>
            </div>
          </div>
        }

      </div>
    </app-sidebar-layout>
  `
})
export class ProviderRecordsComponent implements OnInit {
  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private apptService = inject(AppointmentService);
  private recordService = inject(RecordService);
  private providerService = inject(ProviderService);
  private toast = inject(ToastService);

  records: RecordResponse[] = [];
  completedAppointments: AppointmentSummary[] = [];
  loading = true;
  loadingAppointments = false;
  selectedAppointmentId: string = '';

  // modals
  showCreate = false;
  showEdit = false;
  showAttach = false;
  viewRecord: RecordResponse | null = null;
  editingRecord: RecordResponse | null = null;
  attachTarget: RecordResponse | null = null;

  creating = false;
  saving = false;
  attaching = false;

  attachUrl = '';

  createForm: Partial<CreateRecordRequest> = {};
  editForm: Partial<UpdateRecordRequest> = {};

  navItems: NavItem[] = [];
  
  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.recordService.getByProvider(user.userId).subscribe({
        next: (data) => { this.records = data; this.loading = false; },
        error: () => { this.toast.error('Failed to load records'); this.loading = false; }
      });
    }
  }

  // ── Create ───────────────────────────────────────────────────────────────

  openCreate(): void {
    const user = this.auth.currentUser();
    this.createForm = { providerId: user ? Number(user.userId) : undefined };
    this.selectedAppointmentId = '';
    this.showCreate = true;
    this.loadCompletedAppointments();
  }

  loadCompletedAppointments(): void {
    const user = this.auth.currentUser();
    if (!user) return;

    this.loadingAppointments = true;
    this.providerService.getMyProfile(user.userId).subscribe({
      next: (profile) => {
        this.apptService.getProviderAppointments(profile.providerId).subscribe({
          next: (appts) => {
            this.completedAppointments = appts.filter(a => a.status === 'COMPLETED' || a.status === 'NO_SHOW');
            this.loadingAppointments = false;
          },
          error: () => {
            this.loadingAppointments = false;
            this.toast.error('Failed to load appointments');
          }
        });
      },
      error: () => {
        this.loadingAppointments = false;
        this.toast.error('Failed to load provider profile');
      }
    });
  }

  onAppointmentSelected(): void {
    if (!this.selectedAppointmentId) {
      this.createForm.appointmentId = undefined;
      this.createForm.patientId = undefined;
      return;
    }

    const selected = this.completedAppointments.find(
      a => String(a.appointmentId) === String(this.selectedAppointmentId)
    );

    if (selected) {
      this.createForm.appointmentId = Number(selected.appointmentId);
      this.createForm.patientId = selected.patientId != null ? Number(selected.patientId) : undefined;
    }
  }

  closeCreate(): void { 
    this.showCreate = false; 
    this.createForm = {}; 
    this.selectedAppointmentId = '';
  }

  submitCreate(): void {
    if (
      this.createForm.appointmentId == null ||
      this.createForm.patientId == null ||
      !this.createForm.diagnosis?.trim()
    ) {
      this.toast.error('Select an appointment and enter a diagnosis.');
      return;
    }
    this.creating = true;
    this.recordService.createRecord(this.createForm as CreateRecordRequest).subscribe({
      next: (rec) => {
        this.records.unshift(rec);
        this.toast.success('Medical record created.');
        this.closeCreate();
        this.creating = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to create record.');
        this.creating = false;
      }
    });
  }

  // ── Edit ─────────────────────────────────────────────────────────────────

  openEdit(record: RecordResponse): void {
    this.editingRecord = record;
    this.editForm = {
      diagnosis:    record.diagnosis,
      prescription: record.prescription ?? '',
      notes:        record.notes ?? '',
      followUpDate: record.followUpDate ?? '',
    };
    this.showEdit = true;
  }

  closeEdit(): void { this.showEdit = false; this.editingRecord = null; }

  submitEdit(): void {
    if (!this.editingRecord) return;
    this.saving = true;
    this.recordService.updateRecord(this.editingRecord.recordId, this.editForm).subscribe({
      next: (updated) => {
        const idx = this.records.findIndex(r => r.recordId === updated.recordId);
        if (idx !== -1) this.records[idx] = updated;
        this.toast.success('Record updated.');
        this.closeEdit();
        this.saving = false;
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to update record.');
        this.saving = false;
      }
    });
  }

  // ── Attach ───────────────────────────────────────────────────────────────

  openAttach(record: RecordResponse): void {
    this.attachTarget = record;
    this.attachUrl = '';
    this.showAttach = true;
  }

  closeAttach(): void { this.showAttach = false; this.attachTarget = null; }

  submitAttach(): void {
    if (!this.attachTarget || !this.attachUrl) return;
    this.attaching = true;
    this.recordService.attachDocument(this.attachTarget.recordId, this.attachUrl).subscribe({
      next: (updated) => {
        const idx = this.records.findIndex(r => r.recordId === updated.recordId);
        if (idx !== -1) this.records[idx] = updated;
        this.toast.success('Document attached.');
        this.closeAttach();
        this.attaching = false;
      },
      error: () => { this.toast.error('Failed to attach document.'); this.attaching = false; }
    });
  }

  openView(record: RecordResponse): void { this.viewRecord = record; }
}