import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const mockUser = {
    userId: 1,
    fullName: 'Alice',
    email: 'a@b.com',
    role: 'PATIENT' as const,
    active: true,
    createdAt: '',
  };

  const mockSession = {
    token: 'tok',
    refreshToken: 'ref',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: mockUser,
  };

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'redirectByRole',
      'getProfile',
      'setUserProfile',
    ]);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'warning', 'error']);

    // Default: getProfile returns the full user profile
    authSpy.getProfile.and.returnValue(of(mockUser));
    authSpy.setUserProfile.and.stub();

    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should have oauthUrl set from environment', () => {
    expect(component.oauthUrl).toContain('/oauth2/authorization/google');
  });

  it('should call auth.login with email and password on submit', () => {
    authSpy.login.and.returnValue(of(mockSession));

    component.email = 'a@b.com';
    component.password = 'secret';
    component.onLogin();

    expect(authSpy.login).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    });
  });

  it('should show success toast and redirectByRole on successful login', () => {
    authSpy.login.and.returnValue(of(mockSession));

    component.onLogin();

    expect(toastSpy.success).toHaveBeenCalledWith('Welcome back, Alice!');
    expect(authSpy.redirectByRole).toHaveBeenCalledWith('PATIENT');
  });

  it('should set loading to false after successful login', () => {
    authSpy.login.and.returnValue(of(mockSession));

    component.onLogin();

    expect(component.loading).toBeFalse();
  });

  it('should call getProfile with userId after login', () => {
    authSpy.login.and.returnValue(of(mockSession));

    component.onLogin();

    expect(authSpy.getProfile).toHaveBeenCalledWith(1);
  });

  it('should call setUserProfile with full profile after login', () => {
    authSpy.login.and.returnValue(of(mockSession));

    component.onLogin();

    expect(authSpy.setUserProfile).toHaveBeenCalledWith(mockUser);
  });

  it('should still login if getProfile fails', () => {
    authSpy.login.and.returnValue(of(mockSession));
    authSpy.getProfile.and.returnValue(throwError(() => new Error('Network error')));

    component.onLogin();

    expect(toastSpy.success).toHaveBeenCalledWith('Welcome back, Alice!');
    expect(authSpy.redirectByRole).toHaveBeenCalledWith('PATIENT');
    expect(component.loading).toBeFalse();
  });

  it('should set error message on invalid credentials error', () => {
    authSpy.login.and.returnValue(
      throwError(() => ({ error: { error: 'Bad credentials' } }))
    );

    component.onLogin();

    expect(component.error).toBe('Bad credentials');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to verify-email when EMAIL_NOT_VERIFIED error', () => {
    const navigateSpy = spyOn(router, 'navigate');

    authSpy.login.and.returnValue(
      throwError(() => ({
        error: { error: 'EMAIL_NOT_VERIFIED', email: 'a@b.com' },
      }))
    );

    component.onLogin();

    expect(toastSpy.warning).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(
      ['/verify-email'],
      { queryParams: { email: 'a@b.com' } }
    );
  });

  it('should toggle showPwd', () => {
    expect(component.showPwd).toBeFalse();
    component.showPwd = true;
    expect(component.showPwd).toBeTrue();
  });

  it('should clear error before each login attempt', () => {
    component.error = 'old error';
    authSpy.login.and.returnValue(of(mockSession));

    component.onLogin();

    expect(component.error).toBe('');
  });
});