import { TestBed } from '@angular/core/testing';
import { NavigationService } from './navigation.service';
import { AuthService } from './auth.service';
import { User } from '../models';

describe('NavigationService', () => {
  let service: NavigationService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const makeUser = (role: 'PATIENT' | 'PROVIDER' | 'ADMIN'): User => ({
    userId: 1,
    fullName: 'Test User',
    email: 'test@example.com',
    role,
    active: true,
    createdAt: new Date().toISOString(),
  });

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser: jasmine.createSpy().and.returnValue(null),
    });

    TestBed.configureTestingModule({
      providers: [
        NavigationService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    service = TestBed.inject(NavigationService);
  });

  it('should return empty array when no user is logged in', () => {
    (authServiceSpy as any).currentUser.and.returnValue(null);
    expect(service.getNavItems()).toEqual([]);
  });

  describe('PATIENT nav items', () => {
    beforeEach(() => {
      (authServiceSpy as any).currentUser.and.returnValue(makeUser('PATIENT'));
    });

    it('should return 4 nav items for PATIENT', () => {
      expect(service.getNavItems().length).toBe(4);
    });

    it('should include Dashboard, Appointments, Records, Profile for PATIENT', () => {
      const labels = service.getNavItems().map(n => n.label);
      expect(labels).toContain('Dashboard');
      expect(labels).toContain('Appointments');
      expect(labels).toContain('Records');
      expect(labels).toContain('Profile');
    });

    it('should route patient to /patient/* paths', () => {
      const routes = service.getNavItems().map(n => n.route);
      expect(routes.every(r => r.startsWith('/patient/'))).toBeTrue();
    });
  });

  describe('PROVIDER nav items', () => {
    beforeEach(() => {
      (authServiceSpy as any).currentUser.and.returnValue(makeUser('PROVIDER'));
    });

    it('should return 6 nav items for PROVIDER', () => {
      expect(service.getNavItems().length).toBe(6);
    });

    it('should include Slots and Earnings for PROVIDER', () => {
      const labels = service.getNavItems().map(n => n.label);
      expect(labels).toContain('Slots');
      expect(labels).toContain('Earnings');
    });

    it('should route provider to /provider/* paths', () => {
      const routes = service.getNavItems().map(n => n.route);
      expect(routes.every(r => r.startsWith('/provider/'))).toBeTrue();
    });
  });

  describe('ADMIN nav items', () => {
    beforeEach(() => {
      (authServiceSpy as any).currentUser.and.returnValue(makeUser('ADMIN'));
    });

    it('should return 8 nav items for ADMIN', () => {
      expect(service.getNavItems().length).toBe(8);
    });

    it('should include Pending, Providers, Patients, Reviews, Payments for ADMIN', () => {
      const labels = service.getNavItems().map(n => n.label);
      expect(labels).toContain('Pending');
      expect(labels).toContain('Providers');
      expect(labels).toContain('Patients');
      expect(labels).toContain('Reviews');
      expect(labels).toContain('Payments');
    });

    it('should route admin to /admin/* paths', () => {
      const routes = service.getNavItems().map(n => n.route);
      expect(routes.every(r => r.startsWith('/admin/'))).toBeTrue();
    });
  });
});