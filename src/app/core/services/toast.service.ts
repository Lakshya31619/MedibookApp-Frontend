import { Injectable, signal } from '@angular/core';
import { Toast } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(type: Toast['type'], message: string, duration = 4000): void {
    const id = Math.random().toString(36).slice(2);
    this.toasts.update(t => [...t, { id, type, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(msg: string, d?: number) { this.show('success', msg, d); }
  error(msg: string, d?: number) { this.show('error', msg, d); }
  info(msg: string, d?: number) { this.show('info', msg, d); }
  warning(msg: string, d?: number) { this.show('warning', msg, d); }

  dismiss(id: string): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }
}
