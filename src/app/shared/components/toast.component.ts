import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
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
          <div class="flex-shrink-0 mt-0.5">
            <app-icon
              [name]="toast.type === 'success' ? 'check' : toast.type === 'error' ? 'x' : toast.type === 'warning' ? 'alert-triangle' : 'info'"
              sizeClass="w-5 h-5">
            </app-icon>
          </div>
          <span class="flex-1">{{ toast.message }}</span>
          <button class="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-2" (click)="toastService.dismiss(toast.id)">
            <app-icon name="x" sizeClass="w-4 h-4"></app-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
