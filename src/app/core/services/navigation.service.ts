import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { NavItem } from '../../shared/components/sidebar-layout.component';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private auth = inject(AuthService);

  getNavItems(): NavItem[] {
    const user = this.auth.currentUser();
    const role = user?.role;

    if (role === 'PATIENT') {
      return [
        { label: 'Dashboard',    icon: 'home',          route: '/patient/dashboard' },
        { label: 'Appointments', icon: 'calendar',      route: '/patient/appointments' },
        { label: 'Records',      icon: 'clipboard',     route: '/patient/records' },
        { label: 'Profile',      icon: 'user',          route: '/patient/profile' },
      ];
    }

    if (role === 'PROVIDER') {
      return [
        { label: 'Dashboard',    icon: 'stethoscope',   route: '/provider/dashboard' },
        { label: 'Appointments', icon: 'calendar',      route: '/provider/appointments' },
        { label: 'Slots',        icon: 'clock',         route: '/provider/slots' },
        { label: 'Records',      icon: 'edit',          route: '/provider/records' },
        { label: 'Earnings',     icon: 'dollar-sign',   route: '/provider/earnings' },
        { label: 'Profile',      icon: 'user',          route: '/provider/profile' },
      ];
    }

    if (role === 'ADMIN') {
      return [
        { label: 'Dashboard', icon: 'grid',             route: '/admin/dashboard' },
        { label: 'Pending',   icon: 'alert-triangle',   route: '/admin/pending' },
        { label: 'Providers', icon: 'users',             route: '/admin/providers' },
        { label: 'Patients',  icon: 'activity',          route: '/admin/patients' },
        { label: 'Records',   icon: 'clipboard',         route: '/admin/records' },
        { label: 'Reviews',   icon: 'star',              route: '/admin/reviews' },
        { label: 'Payments',  icon: 'trending-up',       route: '/admin/payments' },
        { label: 'Profile',   icon: 'shield',            route: '/admin/profile' },
      ];
    }

    return [];
  }
}