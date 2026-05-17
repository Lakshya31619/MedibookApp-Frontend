import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" (click)="onCancel()"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 page-enter">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              [ngClass]="danger ? 'bg-red-100' : 'bg-amber-100'">
              {{ danger ? '🗑️' : '⚠️' }}
            </div>
            <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          </div>
          <p class="text-gray-600 mb-4">{{ message }}</p>

          @if (requireReason) {
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ reasonLabel }}</label>
              <textarea [(ngModel)]="reason" rows="3" class="input-field resize-none"
                [placeholder]="reasonPlaceholder"></textarea>
            </div>
          }

          <div class="flex gap-3 justify-end">
            <button class="btn-secondary" (click)="onCancel()">{{ cancelText }}</button>
            <button
              class="px-5 py-2.5 rounded-lg font-medium text-white transition-colors duration-200"
              [ngClass]="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-navy-700 hover:bg-navy-800'"
              [disabled]="requireReason && !reason.trim()"
              (click)="onConfirm()">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() title = 'Confirm Action';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() danger = false;
  @Input() requireReason = false;
  @Input() reasonLabel = 'Reason';
  @Input() reasonPlaceholder = 'Enter reason...';
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';

  onConfirm(): void {
    this.confirmed.emit(this.reason);
    this.reason = '';
  }

  onCancel(): void {
    this.cancelled.emit();
    this.reason = '';
  }
}
