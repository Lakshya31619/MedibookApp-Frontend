import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { ProviderService } from '../../core/services/provider.service';
import { ProviderSummary } from '../../core/models';

@Component({
  selector: 'app-provider-directory',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="bg-navy-700 py-12 px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-serif text-white mb-6 text-center">Find Your Doctor</h1>
        <div class="flex gap-3">
          <input type="text" [(ngModel)]="searchQuery" (input)="onSearch()" placeholder="Search by name or specialization…"
            class="flex-1 input-field text-base py-3">
          <button (click)="onSearch()" class="btn-emerald px-6">Search</button>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Filters -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button (click)="filterSpec('')" class="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
          [ngClass]="activeSpec === '' ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'">
          All
        </button>
        @for (spec of specializations; track spec) {
          <button (click)="filterSpec(spec)" class="px-4 py-1.5 rounded-full text-sm font-medium transition-all border"
            [ngClass]="activeSpec === spec ? 'bg-navy-700 text-white border-navy-700' : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'">
            {{ spec }}
          </button>
        }
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="card animate-pulse">
              <div class="flex gap-4">
                <div class="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div class="flex-1">
                  <div class="h-4 bg-gray-200 rounded mb-2"></div>
                  <div class="h-3 bg-gray-100 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Results -->
      @if (!loading && providers.length === 0) {
        <div class="text-center py-16 text-gray-400">
          <div class="text-5xl mb-4">🔍</div>
          <p class="text-lg">No providers found. Try a different search.</p>
        </div>
      }

      @if (!loading) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          @for (provider of providers; track provider.providerId) {
            <div class="card hover:shadow-md transition-shadow group">
              <div class="flex items-start gap-4 mb-4">
                <div class="w-14 h-14 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-lg flex-shrink-0 overflow-hidden">
                  @if (provider.profilePicUrl) {
                    <img [src]="provider.profilePicUrl" class="w-full h-full object-cover" alt="">
                  } @else {
                    {{ (provider.providerName || provider.clinicName || '?')[0].toUpperCase() }}
                  }
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-900 truncate">Dr. {{ provider.providerName || 'Healthcare Provider' }}</h3>
                  <p class="text-emerald-600 text-sm font-medium">{{ provider.specialization }}</p>
                  @if (provider.experienceYears) {
                    <p class="text-gray-400 text-xs">{{ provider.experienceYears }} yrs experience</p>
                  }
                </div>
              </div>

              @if (provider.clinicName) {
                <p class="text-gray-500 text-sm mb-1">🏥 {{ provider.clinicName }}</p>
              }
              @if (provider.clinicAddress) {
                <p class="text-gray-400 text-xs mb-3">📍 {{ provider.clinicAddress }}</p>
              }

              <div class="flex items-center justify-between pt-3 border-t border-gray-100">
                <div class="flex items-center gap-3 text-sm">
                  @if (provider.consultationFee) {
                    <span class="text-navy-700 font-semibold">₹{{ provider.consultationFee }}</span>
                  }
                  @if (provider.avgRating) {
                    <span class="text-amber-500">★ {{ provider.avgRating.toFixed(1) }}</span>
                  }
                  <span class="text-xs px-2 py-0.5 rounded-full"
                    [ngClass]="provider.available ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'">
                    {{ provider.available ? 'Available' : 'Busy' }}
                  </span>
                </div>
                <a [routerLink]="['/providers', provider.providerId]"
                  class="text-sm text-navy-700 font-medium hover:underline group-hover:text-emerald-600 transition-colors">
                  Book →
                </a>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class ProviderDirectoryComponent implements OnInit {
  private providerService = inject(ProviderService);
  private route = inject(ActivatedRoute);

  providers: ProviderSummary[] = [];
  private allProviders: ProviderSummary[] = []; // full list for client-side name filtering
  loading = true;
  searchQuery = '';
  activeSpec = '';
  specializations = ['Cardiology', 'Neurology', 'Dentistry', 'Ophthalmology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Dermatology', 'Psychiatry', 'Gynecology'];

  ngOnInit(): void {
    const spec = this.route.snapshot.queryParamMap.get('spec');
    if (spec) { this.activeSpec = spec; this.filterSpec(spec); }
    else this.loadAll();
  }

  loadAll(): void {
    this.loading = true;
    this.providerService.getAll().subscribe({
      next: (p) => {
        this.allProviders = p;
        this.providers = p;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.activeSpec = '';

    if (!q) { this.providers = this.allProviders; return; }

    // If we already have all providers loaded, filter client-side by name,
    // specialization, clinic name, and clinic address — this covers doctor name search
    // which the backend query misses (providerName lives in auth-service, not provider DB).
    if (this.allProviders.length) {
      this.providers = this.allProviders.filter(p =>
        (p.providerName  || '').toLowerCase().includes(q) ||
        (p.specialization || '').toLowerCase().includes(q) ||
        (p.clinicName    || '').toLowerCase().includes(q) ||
        (p.clinicAddress || '').toLowerCase().includes(q)
      );
      return;
    }

    // Fallback: hit backend search (covers specialization/clinic only)
    this.loading = true;
    this.providerService.search(this.searchQuery).subscribe({
      next: (p) => { this.providers = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  filterSpec(spec: string): void {
    this.activeSpec = spec;
    this.searchQuery = '';

    if (!spec) {
      this.providers = this.allProviders.length ? this.allProviders : [];
      if (!this.allProviders.length) this.loadAll();
      return;
    }

    // Filter client-side if we already have all providers
    if (this.allProviders.length) {
      this.providers = this.allProviders.filter(
        p => p.specialization?.toLowerCase() === spec.toLowerCase()
      );
      return;
    }

    this.loading = true;
    this.providerService.bySpecialization(spec).subscribe({
      next: (p) => { this.providers = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}