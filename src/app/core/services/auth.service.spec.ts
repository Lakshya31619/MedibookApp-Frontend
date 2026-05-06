import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthSession, LoginRequest, RegisterRequest, User } from '../models';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const base = `${environment.apiUrl}/api/auth`;

  const mockUser: User = {
    userId: '1',
    fullName: 'John Doe',
    email: 'john@example.com',
    role: 'PATIENT',
    active: true,
    createdAt: new Date().toISOString(),
  };

  const mockSession: AuthSession = {
    token: 'test-jwt-token',
    tokenType: 'Bearer',
    expiresIn: 86400000,
    user: mockUser,
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    // Clear localStorage before each test
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── register ────────────────────────────────────────────────────────────────

  it('should POST to /register', () => {
    const req: RegisterRequest = {
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      password: 'Password1!',
      role: 'PATIENT',
    };

    service.register(req).subscribe(res => {
      expect(res.email).toBe('jane@example.com');
    });

    const httpReq = httpMock.expectOne(`${base}/register`);
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush({ message: 'Registered', userId: '2', email: 'jane@example.com', role: 'PATIENT' });
  });

  // ── login ────────────────────────────────────────────────────────────────────

  it('should POST to /login and save session', () => {
    const loginReq: LoginRequest = { email: 'john@example.com', password: 'password' };

    service.login(loginReq).subscribe(session => {
      expect(session.token).toBe('test-jwt-token');
      expect(session.user.role).toBe('PATIENT');
    });

    const httpReq = httpMock.expectOne(`${base}/login`);
    expect(httpReq.request.method).toBe('POST');
    httpReq.flush(mockSession);

    // Session should be persisted to localStorage
    expect(localStorage.getItem('medibook_token')).toBe('test-jwt-token');
    expect(JSON.parse(localStorage.getItem('medibook_user')!).email).toBe('john@example.com');
  });

  it('should set currentUser signal after login', () => {
    const loginReq: LoginRequest = { email: 'john@example.com', password: 'password' };

    service.login(loginReq).subscribe();
    httpMock.expectOne(`${base}/login`).flush(mockSession);

    expect(service.currentUser()).toEqual(mockUser);
  });

  // ── logout ───────────────────────────────────────────────────────────────────

  it('should clear session and navigate to /login on logout', () => {
    localStorage.setItem('medibook_token', 'some-token');
    localStorage.setItem('medibook_user', JSON.stringify(mockUser));

    service.logout();

    httpMock.expectOne(`${base}/logout`).flush({});

    expect(localStorage.getItem('medibook_token')).toBeNull();
    expect(localStorage.getItem('medibook_user')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // ── isLoggedIn ───────────────────────────────────────────────────────────────

  it('should return true when token is in localStorage', () => {
    localStorage.setItem('medibook_token', 'some-token');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should return false when no token in localStorage', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  // ── getToken ─────────────────────────────────────────────────────────────────

  it('should return token from localStorage', () => {
    localStorage.setItem('medibook_token', 'my-token');
    expect(service.getToken()).toBe('my-token');
  });

  it('should return null when no token', () => {
    expect(service.getToken()).toBeNull();
  });

  // ── role ────────────────────────────────────────────────────────────────────

  it('should return null when no user is set', () => {
    expect(service.role).toBeNull();
  });

  it('should return role of logged-in user', () => {
    service.login({ email: 'john@example.com', password: 'p' }).subscribe();
    httpMock.expectOne(`${base}/login`).flush(mockSession);
    expect(service.role).toBe('PATIENT');
  });

  // ── redirectByRole ───────────────────────────────────────────────────────────

  it('should navigate to patient dashboard for PATIENT role', () => {
    service.redirectByRole('PATIENT');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/patient/dashboard']);
  });

  it('should navigate to provider dashboard for PROVIDER role', () => {
    service.redirectByRole('PROVIDER');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/provider/dashboard']);
  });

  it('should navigate to admin dashboard for ADMIN role', () => {
    service.redirectByRole('ADMIN');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/dashboard']);
  });

  // ── updateProfile ────────────────────────────────────────────────────────────

  it('should PUT to /profile/:id and update cached user', () => {
    // Simulate logged in user
    service.login({ email: 'john@example.com', password: 'p' }).subscribe();
    httpMock.expectOne(`${base}/login`).flush(mockSession);

    const updatedUser = { ...mockUser, fullName: 'John Updated' };
    service.updateProfile('1', { fullName: 'John Updated' }).subscribe();

    const httpReq = httpMock.expectOne(`${base}/profile/1`);
    expect(httpReq.request.method).toBe('PUT');
    httpReq.flush({ message: 'Updated', user: updatedUser });

    expect(service.currentUser()?.fullName).toBe('John Updated');
  });

  // ── getAdminUsers ────────────────────────────────────────────────────────────

  it('should GET /admin/users with role param', () => {
    service.getAdminUsers('PATIENT').subscribe();
    const httpReq = httpMock.expectOne(`${base}/admin/users?role=PATIENT`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockUser]);
  });

  it('should GET /admin/users without role param', () => {
    service.getAdminUsers().subscribe();
    const httpReq = httpMock.expectOne(`${base}/admin/users`);
    expect(httpReq.request.method).toBe('GET');
    httpReq.flush([mockUser]);
  });

  // ── updateCachedUser ─────────────────────────────────────────────────────────

  it('should update currentUser signal and localStorage via updateCachedUser', () => {
    service.login({ email: 'john@example.com', password: 'p' }).subscribe();
    httpMock.expectOne(`${base}/login`).flush(mockSession);

    service.updateCachedUser({ fullName: 'John Patched' });

    expect(service.currentUser()?.fullName).toBe('John Patched');
    const stored = JSON.parse(localStorage.getItem('medibook_user')!);
    expect(stored.fullName).toBe('John Patched');
  });

  it('should do nothing in updateCachedUser when no current user', () => {
    expect(() => service.updateCachedUser({ fullName: 'Ghost' })).not.toThrow();
    expect(service.currentUser()).toBeNull();
  });

  // ── sendVerificationCode ─────────────────────────────────────────────────────

  it('should POST to /send-verification', () => {
    service.sendVerificationCode('test@example.com').subscribe();
    const httpReq = httpMock.expectOne(`${base}/send-verification`);
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual({ email: 'test@example.com' });
    httpReq.flush({ message: 'Code sent' });
  });

  // ── verifyEmail ──────────────────────────────────────────────────────────────

  it('should POST to /verify-email', () => {
    service.verifyEmail('test@example.com', '123456').subscribe();
    const httpReq = httpMock.expectOne(`${base}/verify-email`);
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual({ email: 'test@example.com', code: '123456' });
    httpReq.flush({ message: 'Verified' });
  });

  // ── changePassword ───────────────────────────────────────────────────────────

  it('should PUT to /password', () => {
    service.changePassword({ currentPassword: 'old', newPassword: 'New1234!' }).subscribe();
    const httpReq = httpMock.expectOne(`${base}/password`);
    expect(httpReq.request.method).toBe('PUT');
    httpReq.flush({ message: 'Password changed' });
  });

  // ── handleOAuth2Callback ─────────────────────────────────────────────────────

  it('should decode JWT and set user on OAuth2 callback', () => {
    // Build a fake JWT: header.payload.signature (base64url encoded)
    const payload = btoa(JSON.stringify({
      userId: 5,
      sub: 'oauth@example.com',
      role: 'PATIENT',
      fullName: 'OAuth User',
    })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const fakeJwt = `header.${payload}.signature`;

    service.handleOAuth2Callback(fakeJwt);

    const user = service.currentUser();
    expect(user?.email).toBe('oauth@example.com');
    expect(user?.role).toBe('PATIENT');
    expect(user?.userId).toBe('5');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/patient/dashboard']);
  });

  it('should navigate to /login when JWT decode fails', () => {
    service.handleOAuth2Callback('invalid-token');
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
