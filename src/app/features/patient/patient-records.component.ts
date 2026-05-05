import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarLayoutComponent, NavItem } from '../../shared/components/sidebar-layout.component';
import { IconComponent } from '../../shared/components/icon.component';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
import { RecordService } from '../../core/services/record.service';
import { ToastService } from '../../core/services/toast.service';
import { RecordResponse } from '../../core/record.models';

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarLayoutComponent, IconComponent],
  template: `
    <app-sidebar-layout [navItems]="navItems">
      <div class="page-enter">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="page-title">Medical Records</h1>
            <p class="page-subtitle">Your health history and consultation notes</p>
          </div>
        </div>

        <!-- Loading skeleton -->
        @if (loading) {
          <div class="space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="card animate-pulse h-28"></div>
            }
          </div>
        }

        <!-- Empty state -->
        @if (!loading && records.length === 0) {
          <div class="card text-center py-14">
            <div class="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <app-icon name="file-text" [size]="22" class="text-slate-400"></app-icon>
            </div>
            <p class="font-medium text-slate-600 mb-1">No medical records yet</p>
            <p class="text-sm text-slate-400">Records will appear here after your consultations.</p>
          </div>
        }

        <!-- Records list -->
        @if (!loading && records.length > 0) {
          <div class="space-y-4">
            @for (record of records; track record.recordId) {
              <div class="card cursor-pointer hover:shadow-md transition-shadow"
                   (click)="openDetail(record)">
                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                  <div class="flex items-start gap-3 flex-1">
                    <div class="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <app-icon name="clipboard" [size]="18" class="text-teal-600"></app-icon>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-semibold text-slate-900 text-sm truncate">{{ record.diagnosis }}</p>
                      <p class="text-xs text-slate-500 mt-0.5">
                        {{ record.createdAt | date:'mediumDate' }}
                        · Appointment #{{ record.appointmentId }}
                      </p>
                      @if (record.prescription) {
                        <p class="text-xs text-slate-400 mt-1 truncate">
                          <span class="font-medium text-slate-500">Rx:</span> {{ record.prescription }}
                        </p>
                      }
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0">
                    @if (record.followUpDate) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <app-icon name="calendar" [size]="11"></app-icon>
                        Follow-up {{ record.followUpDate | date:'mediumDate' }}
                      </span>
                    }
                    @if (record.attachmentUrl) {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        Attachment
                      </span>
                    }
                    <app-icon name="chevron-right" [size]="16" class="text-slate-400"></app-icon>
                  </div>

                </div>
              </div>
            }
          </div>
        }

        <!-- Record Detail Modal -->
        @if (selectedRecord) {
          <div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16"
               (click)="closeDetail()">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
                 (click)="$event.stopPropagation()">

              <!-- Modal header -->
              <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
                <h2 class="text-lg font-semibold text-slate-900">Medical Record</h2>
                <div class="flex items-center gap-2">
                  <button
                    (click)="downloadPdf(selectedRecord); $event.stopPropagation()"
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors">
                    <app-icon name="download" [size]="13"></app-icon>
                    Download PDF
                  </button>
                  <button (click)="closeDetail()" class="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
                    <app-icon name="x" [size]="18"></app-icon>
                  </button>
                </div>
              </div>

              <!-- Modal body -->
              <div class="px-6 py-5 space-y-5">

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Date</p>
                    <p class="text-slate-800">{{ selectedRecord.createdAt | date:'mediumDate' }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Appointment</p>
                    <p class="text-slate-800">#{{ selectedRecord.appointmentId }}</p>
                  </div>
                </div>

                <div>
                  <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Diagnosis</p>
                  <p class="text-slate-800 text-sm leading-relaxed bg-slate-50 rounded-lg p-3">{{ selectedRecord.diagnosis }}</p>
                </div>

                @if (selectedRecord.prescription) {
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Prescription</p>
                    <p class="text-slate-800 text-sm leading-relaxed bg-green-50 rounded-lg p-3">{{ selectedRecord.prescription }}</p>
                  </div>
                }

                @if (selectedRecord.notes) {
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Doctor's Notes</p>
                    <p class="text-slate-800 text-sm leading-relaxed bg-slate-50 rounded-lg p-3">{{ selectedRecord.notes }}</p>
                  </div>
                }

                @if (selectedRecord.followUpDate) {
                  <div class="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <app-icon name="calendar" [size]="16" class="text-amber-600 flex-shrink-0"></app-icon>
                    <div>
                      <p class="text-xs font-semibold text-amber-800">Follow-up Scheduled</p>
                      <p class="text-sm text-amber-700">{{ selectedRecord.followUpDate | date:'fullDate' }}</p>
                    </div>
                    @if (selectedRecord.followUpReminderSent) {
                      <span class="ml-auto text-xs text-amber-600 flex items-center gap-1">
                        <app-icon name="check" [size]="12"></app-icon> Reminded
                      </span>
                    }
                  </div>
                }

                @if (selectedRecord.attachmentUrl) {
                  <div>
                    <p class="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">Attachment</p>
                    <a [href]="selectedRecord.attachmentUrl" target="_blank"
                       class="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
                      View Document
                    </a>
                  </div>
                }

                <p class="text-xs text-slate-400 pt-2 border-t border-slate-100">
                  Last updated: {{ selectedRecord.updatedAt | date:'medium' }}
                </p>

              </div>
            </div>
          </div>
        }

      </div>
    </app-sidebar-layout>
  `
})
export class PatientRecordsComponent implements OnInit {
  private auth = inject(AuthService);
  private navigationService = inject(NavigationService);
  private recordService = inject(RecordService);
  private toast = inject(ToastService);

  records: RecordResponse[] = [];
  selectedRecord: RecordResponse | null = null;
  loading = true;

  navItems: NavItem[] = [];

  constructor() {
    this.navItems = this.navigationService.getNavItems();
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.recordService.getByPatient(user.userId).subscribe({
        next: (data) => { this.records = data; this.loading = false; },
        error: () => { this.toast.error('Failed to load records'); this.loading = false; }
      });
    }
  }

  openDetail(record: RecordResponse): void { this.selectedRecord = record; }
  closeDetail(): void { this.selectedRecord = null; }

  downloadPdf(record: RecordResponse): void {
    const patientName = this.auth.currentUser()?.fullName ?? 'Patient';
    const fmt = (d: string | null) =>
      d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    const html = `
      <html>
      <head>
        <meta charset="utf-8">
        <title>Medical Record #${record.recordId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; color: #1e293b; background: #fff; padding: 48px 56px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 2px solid #0f3460; margin-bottom: 28px; }
          .brand { font-size: 22px; font-weight: bold; color: #0f3460; letter-spacing: -0.5px; }
          .brand span { color: #10b981; }
          .meta { text-align: right; font-size: 11px; color: #64748b; line-height: 1.6; }
          .title { font-size: 18px; font-weight: bold; color: #0f3460; margin-bottom: 20px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 32px; margin-bottom: 24px; }
          .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-family: Arial, sans-serif; margin-bottom: 3px; }
          .field-value { font-size: 13px; color: #1e293b; }
          .section { margin-bottom: 20px; }
          .section-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-family: Arial, sans-serif; margin-bottom: 6px; }
          .section-box { background: #f8fafc; border-left: 3px solid #0f3460; padding: 12px 14px; border-radius: 0 6px 6px 0; font-size: 13px; line-height: 1.65; color: #334155; }
          .section-box.rx { border-color: #10b981; background: #f0fdf4; }
          .section-box.notes { border-color: #6366f1; background: #f5f3ff; }
          .followup { display: flex; align-items: center; gap: 10px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #92400e; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: Arial, sans-serif; }
          .confidential { font-size: 9px; text-align: center; color: #cbd5e1; margin-top: 8px; letter-spacing: 0.05em; text-transform: uppercase; }
          @media print {
            body { padding: 32px 40px; }
            @page { margin: 0; size: A4; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Medi<span>Book</span></div>
          <div class="meta">
            <div><strong>Medical Record #${record.recordId}</strong></div>
            <div>Patient: ${patientName}</div>
            <div>Appointment: #${record.appointmentId}</div>
            <div>Generated: ${fmt(new Date().toISOString())}</div>
          </div>
        </div>

        <div class="title">Consultation Summary</div>

        <div class="grid">
          <div>
            <div class="field-label">Consultation Date</div>
            <div class="field-value">${fmt(record.createdAt)}</div>
          </div>
          <div>
            <div class="field-label">Last Updated</div>
            <div class="field-value">${fmt(record.updatedAt)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-label">Diagnosis</div>
          <div class="section-box">${record.diagnosis}</div>
        </div>

        ${record.prescription ? `
        <div class="section">
          <div class="section-label">Prescription</div>
          <div class="section-box rx">${record.prescription}</div>
        </div>` : ''}

        ${record.notes ? `
        <div class="section">
          <div class="section-label">Doctor's Notes</div>
          <div class="section-box notes">${record.notes}</div>
        </div>` : ''}

        ${record.followUpDate ? `
        <div class="followup">
          &#128197; <strong>Follow-up scheduled:</strong> ${fmt(record.followUpDate)}
          ${record.followUpReminderSent ? '&nbsp;· Reminder sent ✓' : ''}
        </div>` : ''}

        ${record.attachmentUrl ? `
        <div class="section">
          <div class="section-label">Attachment</div>
          <div class="field-value" style="font-size:12px; color:#3b82f6;">${record.attachmentUrl}</div>
        </div>` : ''}

        <div class="footer">
          <span>MediBook Health Platform</span>
          <span>Record ID: ${record.recordId} · Patient ID: ${record.patientId}</span>
        </div>
        <div class="confidential">Confidential medical document — for authorised use only</div>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=794,height=1123');
    if (!win) {
      this.toast.error('Pop-up blocked — please allow pop-ups and try again.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    // Small delay lets the browser finish painting before print dialog opens
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  }
}