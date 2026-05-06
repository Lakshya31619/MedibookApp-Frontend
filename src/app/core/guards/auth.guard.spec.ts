import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, roleGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

/**
 * Helper: run a functional guard by calling it via TestBed injection context.
 */
function runGuard(guardFn: any): boolean | any {
  return TestBed.runInInjectionContext(() => guardFn({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
}

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should return true when user is logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    expect(runGuard(authGuard)).toBeTrue();
  });

  it('should navigate to /login and return false when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    expect(runGuard(authGuard)).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});

describe('roleGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'redirectByRole']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should return true when user has the required role', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    Object.defineProperty(authServiceSpy, 'role', { get: () => 'PATIENT', configurable: true });

    const guard = roleGuard('PATIENT', 'ADMIN');
    expect(runGuard(guard)).toBeTrue();
  });

  it('should redirect to login when not logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    Object.defineProperty(authServiceSpy, 'role', { get: () => null, configurable: true });

    const guard = roleGuard('PATIENT');
    expect(runGuard(guard)).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect to own dashboard when role does not match', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    Object.defineProperty(authServiceSpy, 'role', { get: () => 'PROVIDER', configurable: true });

    const guard = roleGuard('PATIENT', 'ADMIN');
    expect(runGuard(guard)).toBeFalse();
    expect(authServiceSpy.redirectByRole).toHaveBeenCalledWith('PROVIDER');
  });

  it('should allow ADMIN access to ADMIN-only routes', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    Object.defineProperty(authServiceSpy, 'role', { get: () => 'ADMIN', configurable: true });

    const guard = roleGuard('ADMIN');
    expect(runGuard(guard)).toBeTrue();
  });
});

describe('guestGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'redirectByRole']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    });
  });

  it('should return true when user is NOT logged in (guest)', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);
    expect(runGuard(guestGuard)).toBeTrue();
  });

  it('should redirect to role dashboard when already logged in', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    Object.defineProperty(authServiceSpy, 'role', { get: () => 'PATIENT', configurable: true });

    expect(runGuard(guestGuard)).toBeFalse();
    expect(authServiceSpy.redirectByRole).toHaveBeenCalledWith('PATIENT');
  });
});
