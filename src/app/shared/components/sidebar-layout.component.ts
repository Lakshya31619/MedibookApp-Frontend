import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ProviderService } from '../../core/services/provider.service';
import { IconComponent } from './icon.component';

export interface NavItem {
  label: string;
  icon?: string;
  iconName?: string;
  route: string;
}

@Component({
  selector: 'app-sidebar-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="flex h-screen bg-gray-50 overflow-hidden">
      <!-- Mobile overlay -->
      @if (mobileOpen()) {
        <div class="fixed inset-0 bg-black/50 z-30 lg:hidden" (click)="mobileOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-navy-700 flex flex-col transition-transform duration-300 ease-in-out"
        [class.-translate-x-full]="!mobileOpen()"
        [class.lg:translate-x-0]="true">

        <!-- Logo -->
        <div class="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
          <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span class="text-white text-sm font-bold">M</span>
          </div>
          <span class="font-serif text-xl text-white">MediBook</span>
        </div>

        <!-- User info -->
        <div class="px-6 py-4 border-b border-white/10">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden bg-white/20">
              @if (profilePicUrl()) {
                <img [src]="profilePicUrl()" class="w-full h-full object-cover" [alt]="auth.currentUser()?.fullName || 'Profile'">
              } @else {
                {{ initials }}
              }
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium truncate">{{ auth.currentUser()?.fullName }}</p>
              <p class="text-navy-200 text-xs capitalize">{{ auth.currentUser()?.role?.toLowerCase() }}</p>
            </div>
          </div>
        </div>

        <!-- Nav items -->
        <nav class="flex-1 px-3 py-4 overflow-y-auto">
          @for (item of navItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="sidebar-link mb-1"
              (click)="mobileOpen.set(false)">
              @if (item.iconName) {
                <app-icon [name]="item.iconName" sizeClass="w-5 h-5"></app-icon>
              } @else if (item.icon) {
                <span class="text-lg w-6 text-center">{{ item.icon }}</span>
              }
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <!-- Logout -->
        <div class="px-3 py-4 border-t border-white/10">
          <button (click)="logout()" class="sidebar-link w-full">
            <app-icon name="x" sizeClass="w-5 h-5"></app-icon>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top bar (mobile) -->
        <header class="bg-white border-b border-gray-100 px-4 py-3 lg:hidden flex items-center gap-3">
          <button (click)="mobileOpen.set(true)" class="text-gray-600 hover:text-gray-900">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span class="font-serif text-lg text-navy-700">MediBook</span>
        </header>

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto p-4 lg:p-6 page-enter">
          <ng-content></ng-content>
        </main>
      </div>
    </div>
  `
})
export class SidebarLayoutComponent implements OnInit {
  @Input() navItems: NavItem[] = [];
  auth = inject(AuthService);
  private providerService = inject(ProviderService);
  mobileOpen = signal(false);
  profilePicUrl = signal<string | null>(null);

  get initials(): string {
    const name = this.auth.currentUser()?.fullName || '';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  }

  ngOnInit(): void {
    // Load profile picture for providers
    const currentUser = this.auth.currentUser();
    if (currentUser && currentUser.role === 'PROVIDER') {
      this.providerService.getMyProfile(currentUser.userId).subscribe({
        next: (profile) => {
          if (profile.profilePicUrl) {
            this.profilePicUrl.set(profile.profilePicUrl);
          }
        },
        error: () => {
          // Silently fail - just show initials
        }
      });
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
