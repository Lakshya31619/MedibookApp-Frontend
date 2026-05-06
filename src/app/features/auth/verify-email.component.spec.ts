import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('VerifyEmailComponent', () => {
  let component: VerifyEmailComponent;
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const makeRoute = (email?: string) => ({
    snapshot: {
      queryParamMap: {
        get: (k: string) => (k === 'email' ? email ?? null : null),
      },
    },
  });

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['verifyEmail', 'sendVerificationCode']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ActivatedRoute, useValue: makeRoute('user@example.com') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    // ✅ prevent undefined.subscribe crash
    authSpy.verifyEmail.and.returnValue(of({ message: 'Verified' }));
    authSpy.sendVerificationCode.and.returnValue(of({ message: 'Sent' }));

    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  it('should create', () => expect(component).toBeTruthy());

  it('should read email from query params on init', () => {
    expect(component.email).toBe('user@example.com');
  });

  it('should redirect to /register when no email in params', async () => {
    const navigateSpy = spyOn(router, 'navigate');

    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ActivatedRoute, useValue: makeRoute(undefined) }, // ✅ no email
      ],
    }).compileComponents();

    const f2 = TestBed.createComponent(VerifyEmailComponent);
    const c2 = f2.componentInstance;
    const r2 = TestBed.inject(Router);
    const navSpy2 = spyOn(r2, 'navigate');

    c2.ngOnInit();

    expect(navSpy2).toHaveBeenCalledWith(['/register']);
  });

  it('codeLength should count filled digits', () => {
    component.digits = ['1', '2', '3', '', '', ''];
    expect(component.codeLength).toBe(3);
  });

  it('code getter should join digits', () => {
    component.digits = ['1', '2', '3', '4', '5', '6'];
    expect(component.code).toBe('123456');
  });

  it('should not call verifyEmail when fewer than 6 digits', () => {
    component.digits = ['1', '2', '3', '', '', ''];
    component.onVerify();
    expect(authSpy.verifyEmail).not.toHaveBeenCalled();
  });

  it('should call verifyEmail with email and code when 6 digits entered', () => {
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.onVerify();
    expect(authSpy.verifyEmail).toHaveBeenCalledWith('user@example.com', '123456');
  });

  it('should show success toast and navigate to login after verification', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');

    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.onVerify();

    expect(toastSpy.success).toHaveBeenCalled();

    tick(1500);

    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  }));

  it('should set error and clear digits on verification failure', () => {
    authSpy.verifyEmail.and.returnValue(
      throwError(() => ({ error: { error: 'Invalid OTP' } }))
    );

    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.onVerify();

    expect(component.error).toBe('Invalid OTP');
    expect(component.digits).toEqual(['', '', '', '', '', '']);
  });

  it('should set loading false after verify error', () => {
    authSpy.verifyEmail.and.returnValue(throwError(() => ({ error: {} })));

    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.onVerify();

    expect(component.loading).toBeFalse();
  });

  it('should call sendVerificationCode on resend', () => {
    component.onResend();
    expect(authSpy.sendVerificationCode).toHaveBeenCalledWith('user@example.com');
  });

  it('should start cooldown after successful resend', fakeAsync(() => {
    component.onResend();

    expect(component.resendCooldown).toBe(60);

    tick(1000);
    expect(component.resendCooldown).toBe(59);

    tick(59000);
    expect(component.resendCooldown).toBe(0);
  }));

  it('should set error on resend failure', () => {
    authSpy.sendVerificationCode.and.returnValue(
      throwError(() => ({ error: { error: 'User not found' } }))
    );

    component.onResend();

    expect(component.error).toBe('User not found');
  });

  it('should clear digits on successful resend', () => {
    component.digits = ['1', '2', '3', '4', '5', '6'];

    component.onResend();

    expect(component.digits).toEqual(['', '', '', '', '', '']);
  });

  it('should paste numeric digits from clipboard', () => {
    const event = {
      preventDefault: () => {},
      clipboardData: { getData: () => '123456' },
    } as any;

    component.onPaste(event);

    expect(component.digits).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('should strip non-numeric characters from pasted text', () => {
    const event = {
      preventDefault: () => {},
      clipboardData: { getData: () => 'ab1 2 3 4c5d6e' },
    } as any;

    component.onPaste(event);

    expect(component.digits).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('should handle paste of fewer than 6 digits', () => {
    const event = {
      preventDefault: () => {},
      clipboardData: { getData: () => '123' },
    } as any;

    component.onPaste(event);

    expect(component.digits[0]).toBe('1');
    expect(component.digits[3]).toBe('');
  });

  it('should clear previous digit on Backspace when current digit is empty', () => {
    component.digits = ['1', '2', '', '', '', ''];

    const event = { key: 'Backspace' } as KeyboardEvent;

    component.onKeyDown(event, 2);

    expect(component.digits[1]).toBe('');
  });

  it('should not go below index 0 on Backspace at first digit', () => {
    component.digits = ['', '', '', '', '', ''];

    const event = { key: 'Backspace' } as KeyboardEvent;

    expect(() => component.onKeyDown(event, 0)).not.toThrow();
  });
});