import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [class]="'inline-block ' + (sizeClass || 'w-5 h-5')"
      [style.width.px]="size"
      [style.height.px]="size"
      [attr.viewBox]="viewBox"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round">
      <ng-container [ngSwitch]="name">
        <!-- Check -->
        <ng-container *ngSwitchCase="'check'">
          <polyline points="20 6 9 17 4 12"></polyline>
        </ng-container>
        <!-- X (Close) -->
        <ng-container *ngSwitchCase="'x'">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </ng-container>
        <!-- Alert/Warning -->
        <ng-container *ngSwitchCase="'alert-triangle'">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05l-8.47-14.14a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </ng-container>
        <!-- Info -->
        <ng-container *ngSwitchCase="'info'">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </ng-container>
        <!-- Calendar -->
        <ng-container *ngSwitchCase="'calendar'">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </ng-container>
        <!-- Clock -->
        <ng-container *ngSwitchCase="'clock'">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </ng-container>
        <!-- User -->
        <ng-container *ngSwitchCase="'user'">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </ng-container>
        <!-- Hospital -->
        <ng-container *ngSwitchCase="'hospital'">
          <path d="M12 2v6m0 0h-5v16h14V8h-5V2z"></path>
          <line x1="9" y1="11" x2="9" y2="17"></line>
          <line x1="15" y1="11" x2="15" y2="17"></line>
          <line x1="12" y1="11" x2="12" y2="17"></line>
        </ng-container>
        <!-- Stethoscope -->
        <ng-container *ngSwitchCase="'stethoscope'">
          <path d="M4.9 18.9c1.2 1.2 3.15 1.9 5.1 1.9 1.95 0 3.9-.7 5.1-1.9"></path>
          <path d="M20 14c0-3.3-2.7-6-6-6s-6 2.7-6 6"></path>
          <path d="M10 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"></path>
        </ng-container>
        <!-- Check Circle -->
        <ng-container *ngSwitchCase="'check-circle'">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </ng-container>
        <!-- X Circle -->
        <ng-container *ngSwitchCase="'x-circle'">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </ng-container>
        <!-- Clock with hourglass -->
        <ng-container *ngSwitchCase="'hourglass'">
          <path d="M6 2h12v6H6zM9 8h6l-3 4-3-4zM6 12h12v6H6z"></path>
        </ng-container>
        <!-- Home -->
        <ng-container *ngSwitchCase="'home'">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </ng-container>
        <!-- Search -->
        <ng-container *ngSwitchCase="'search'">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </ng-container>
        <!-- Grid -->
        <ng-container *ngSwitchCase="'grid'">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </ng-container>
        <!-- Users -->
        <ng-container *ngSwitchCase="'users'">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </ng-container>
        <!-- Dollar Sign -->
        <ng-container *ngSwitchCase="'dollar-sign'">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </ng-container>
        <!-- Plus -->
        <ng-container *ngSwitchCase="'plus'">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </ng-container>
        <!-- Refresh CW -->
        <ng-container *ngSwitchCase="'refresh-cw'">
          <polyline points="23 4 23 10 17 10"></polyline>
          <polyline points="1 20 1 14 7 14"></polyline>
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"></path>
        </ng-container>
        <!-- Video -->
        <ng-container *ngSwitchCase="'video'">
          <polygon points="23 7 16 12 23 17 23 7"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </ng-container>
        <!-- Clipboard -->
        <ng-container *ngSwitchCase="'clipboard'">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
        </ng-container>
        <!-- Trending Up -->
        <ng-container *ngSwitchCase="'trending-up'">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </ng-container>
        <!-- Default case -->
        <ng-container *ngSwitchDefault>
          <circle cx="12" cy="12" r="10"></circle>
        </ng-container>
      </ng-container>
    </svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class IconComponent {
  @Input() name: string = 'info';
  @Input() sizeClass: string = 'w-5 h-5';
  @Input() size: number = 20;
  viewBox = '0 0 24 24';
}
