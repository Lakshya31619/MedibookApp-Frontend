import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <a routerLink="/" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center">
              <span class="text-white text-sm font-bold">M</span>
            </div>
            <span class="font-serif text-xl text-navy-700">MediBook</span>
          </a>

          <div class="hidden md:flex items-center gap-6">
            <a routerLink="/providers" class="text-gray-600 hover:text-navy-700 text-sm font-medium transition-colors">Find Doctors</a>
          </div>

          <div class="flex items-center gap-3">
            @if (auth.isLoggedIn()) {
              <button (click)="goToDashboard()" class="btn-primary text-sm py-2">Dashboard</button>
            } @else {
              <a routerLink="/login" class="text-sm font-medium text-gray-600 hover:text-navy-700 transition-colors">Sign In</a>
              <a routerLink="/register" class="btn-primary text-sm py-2">Get Started</a>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);

  goToDashboard(): void {
    this.auth.redirectByRole(this.auth.role!);
  }
}
