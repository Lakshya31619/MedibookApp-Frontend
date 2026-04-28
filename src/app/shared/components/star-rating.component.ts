import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Usage — display only:
 *   <app-star-rating [value]="4.3"></app-star-rating>
 *
 * Usage — interactive (for review forms):
 *   <app-star-rating [value]="rating" [interactive]="true" (valueChange)="rating = $event"></app-star-rating>
 */
@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-0.5">
      @for (star of stars; track star) {
        <button
          type="button"
          [disabled]="!interactive"
          (click)="interactive && onSelect(star)"
          (mouseenter)="interactive && (hovered = star)"
          (mouseleave)="interactive && (hovered = 0)"
          class="transition-transform duration-75"
          [class.hover:scale-110]="interactive"
          [class.cursor-default]="!interactive"
          [class.cursor-pointer]="interactive">
          <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none">
            <!-- Filled portion -->
            <defs>
              <linearGradient [id]="'grad-' + star + '-' + uid">
                <stop [attr.offset]="fillPercent(star) + '%'" stop-color="currentColor"/>
                <stop [attr.offset]="fillPercent(star) + '%'" stop-color="transparent"/>
              </linearGradient>
            </defs>
            <polygon
              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
              [attr.fill]="starFill(star)"
              [attr.stroke]="starStroke(star)"
              stroke-width="1.5"
              stroke-linejoin="round"/>
          </svg>
        </button>
      }
      @if (showLabel && value > 0) {
        <span class="ml-1.5 text-sm font-semibold text-slate-700">{{ value.toFixed(1) }}</span>
      }
      @if (count !== null) {
        <span class="ml-1 text-xs text-slate-400">({{ count }})</span>
      }
    </div>
  `
})
export class StarRatingComponent {
  @Input() value = 0;           // 0–5, supports decimals for display
  @Input() interactive = false; // true = clickable
  @Input() size = 18;
  @Input() showLabel = false;
  @Input() count: number | null = null;
  @Output() valueChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5];
  hovered = 0;
  uid = Math.random().toString(36).slice(2, 7);

  /** Which value drives the display — hover takes priority in interactive mode */
  get display(): number {
    return this.interactive && this.hovered ? this.hovered : this.value;
  }

  fillPercent(star: number): number {
    const d = this.display;
    if (star <= Math.floor(d)) return 100;
    if (star - 1 < d && d < star) return Math.round((d - (star - 1)) * 100);
    return 0;
  }

  starFill(star: number): string {
    const pct = this.fillPercent(star);
    if (pct === 100) return '#f59e0b'; // amber-400 — full
    if (pct > 0)     return 'url(#grad-' + star + '-' + this.uid + ')'; // partial
    return 'transparent'; // empty
  }

  starStroke(star: number): string {
    return this.fillPercent(star) > 0 ? '#f59e0b' : '#d1d5db'; // amber or gray-200
  }

  onSelect(star: number): void {
    this.valueChange.emit(star);
  }
}