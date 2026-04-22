import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterModule, NavbarComponent, IconComponent],
  template: `
    <app-navbar></app-navbar>

    <!-- Hero -->
    <section class="bg-gradient-to-br from-navy-700 via-navy-800 to-navy-900 text-white py-20 px-4">
      <div class="max-w-5xl mx-auto text-center page-enter">
        <div class="inline-block bg-white/10 text-emerald-400 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 border border-white/20">
          <app-icon name="hospital" sizeClass="w-4 h-4 inline mr-2"></app-icon>Healthcare Made Simple
        </div>
        <h1 class="text-5xl md:text-6xl font-serif mb-6 leading-tight">
          Book Appointments<br/>
          <span class="text-emerald-400">Instantly & Easily</span>
        </h1>
        <p class="text-navy-200 text-lg max-w-2xl mx-auto mb-10">
          Connect with verified doctors, schedule appointments in seconds, and manage your health journey—all from one platform.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/providers" class="btn-emerald text-base px-8 py-3">Find a Doctor</a>
          <a routerLink="/register" class="bg-white/10 text-white border border-white/30 hover:bg-white/20 px-8 py-3 rounded-lg font-medium transition-colors text-base">
            Create Account
          </a>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-20 px-4 max-w-6xl mx-auto">
      <h2 class="text-4xl font-serif text-center text-navy-700 mb-12">Why MediBook?</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @for (feature of features; track feature.title) {
          <div class="card text-center hover:shadow-md transition-shadow">
            <div class="inline-block p-3 bg-navy-50 rounded-xl mb-4">
              <app-icon [name]="feature.icon" sizeClass="w-8 h-8 text-navy-700"></app-icon>
            </div>
            <h3 class="text-xl font-serif text-navy-700 mb-2">{{ feature.title }}</h3>
            <p class="text-gray-500 text-sm leading-relaxed">{{ feature.desc }}</p>
          </div>
        }
      </div>
    </section>

    <!-- Specializations -->
    <section class="bg-gray-50 py-16 px-4">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-3xl font-serif text-center text-navy-700 mb-10">Browse by Specialization</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @for (spec of specializations; track spec.label) {
            <a [routerLink]="['/providers']" [queryParams]="{spec: spec.label}"
               class="card flex flex-col items-center gap-3 py-6 hover:shadow-md hover:border-navy-200 transition-all cursor-pointer text-center group">
              <div class="inline-block p-2 bg-navy-50 rounded-lg group-hover:bg-navy-100 transition-colors">
                <app-icon [name]="spec.icon" sizeClass="w-6 h-6 text-navy-700"></app-icon>
              </div>
              <span class="text-sm font-medium text-gray-700">{{ spec.label }}</span>
            </a>
          }
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-navy-700 py-16 px-4 text-center">
      <h2 class="text-3xl font-serif text-white mb-4">Are you a Healthcare Provider?</h2>
      <p class="text-navy-200 mb-8 max-w-xl mx-auto">Join MediBook, get verified, and reach thousands of patients looking for quality care.</p>
      <a routerLink="/register" [queryParams]="{role: 'PROVIDER'}" class="btn-emerald px-8 py-3 text-base">
        Register as Provider
      </a>
    </section>

    <!-- Footer -->
    <footer class="bg-navy-900 text-navy-300 text-sm py-8 px-4 text-center">
      <p>© 2024 MediBook. All rights reserved.</p>
    </footer>
  `
})
export class LandingComponent {
  features = [
    { icon: 'user', title: 'Find Specialists', desc: 'Search by specialization, location, or doctor name. Filter by availability and fees.' },
    { icon: 'calendar', title: 'Instant Booking', desc: 'See real-time slot availability and book appointments in under 60 seconds.' },
    { icon: 'check-circle', title: 'Verified Providers', desc: 'Every doctor is reviewed and approved by our admin team before going live.' },
  ];
  specializations = [
    { icon: 'stethoscope', label: 'Cardiology' }, { icon: 'stethoscope', label: 'Neurology' },
    { icon: 'stethoscope', label: 'Dentistry' }, { icon: 'stethoscope', label: 'Ophthalmology' },
    { icon: 'stethoscope', label: 'Orthopedics' }, { icon: 'stethoscope', label: 'Pediatrics' },
    { icon: 'stethoscope', label: 'General Medicine' }, { icon: 'stethoscope', label: 'Dermatology' },
  ];
}
