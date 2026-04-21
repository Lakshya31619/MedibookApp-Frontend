import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto toast-enter flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[300px] max-w-sm text-sm font-medium"
          [ngClass]="{
            'bg-emerald-600 text-white': toast.type === 'success',
            'bg-red-600 text-white': toast.type === 'error',
            'bg-navy-700 text-white': toast.type === 'info',
            'bg-amber-500 text-white': toast.type === 'warning'
          }">
          <span class="text-lg leading-none mt-0.5">
            {{ toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ' }}
          </span>
          <span class="flex-1">{{ toast.message }}</span>
          <button class="opacity-70 hover:opacity-100 transition-opacity ml-2" (click)="toastService.dismiss(toast.id)">✕</button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
