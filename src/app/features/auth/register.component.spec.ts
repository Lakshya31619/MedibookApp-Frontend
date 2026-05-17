import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let toastSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const makeRoute = (role?: string) => ({
    snapshot: {
      queryParamMap: {
        get: (k: string) => (k === 'role' ? role ?? null : null),
      },
    },
  });

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['register']);
    toastSpy = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ActivatedRoute, useValue: makeRoute() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should default role to PATIENT', () => {
    expect(component.role).toBe('PATIENT');
  });

  it('should set role to PROVIDER from query param', async () => {
    await TestBed.resetTestingModule();

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ToastService, useValue: toastSpy },
        { provide: ActivatedRoute, useValue: makeRoute('PROVIDER') },
      ],
    }).compileComponents();

    const f2 = TestBed.createComponent(RegisterComponent);
    f2.componentInstance.ngOnInit();

    expect(f2.componentInstance.role).toBe('PROVIDER');
  });

  it('should call auth.register with correct payload on submit', () => {
    authSpy.register.and.returnValue(
      of({
        message: 'ok',
        email: 'a@b.com',
        userId: '1',
        role: 'PATIENT', // ✅ FIXED
      })
    );

    component.fullName = 'Alice';
    component.email = 'a@b.com';
    component.password = 'password1';
    component.phone = '9876543210';
    component.role = 'PATIENT';

    component.onRegister();

    expect(authSpy.register).toHaveBeenCalledWith(
      jasmine.objectContaining({
        fullName: 'Alice',
        email: 'a@b.com',
        password: 'password1',
        role: 'PATIENT',
      })
    );
  });

  it('should navigate to verify-email on successful registration', () => {
    const navigateSpy = spyOn(router, 'navigate');

    authSpy.register.and.returnValue(
      of({
        message: 'ok',
        email: 'a@b.com',
        userId: '1',
        role: 'PATIENT', // ✅ FIXED
      })
    );

    component.email = 'a@b.com';

    component.onRegister();

    expect(navigateSpy).toHaveBeenCalledWith(
      ['/verify-email'],
      { queryParams: { email: 'a@b.com' } }
    );

    expect(toastSpy.success).toHaveBeenCalled();
  });

  it('should set fieldErrors from server validation errors', () => {
    authSpy.register.and.returnValue(
      throwError(() => ({
        error: {
          errors: {
            email: 'Email already in use',
            password: 'Too short',
          },
        },
      }))
    );

    component.onRegister();

    expect(component.fieldErrors['email']).toBe('Email already in use');
    expect(component.fieldErrors['password']).toBe('Too short');
  });

  it('should set generic error on non-field server error', () => {
    authSpy.register.and.returnValue(
      throwError(() => ({
        error: { error: 'Email already exists' },
      }))
    );

    component.onRegister();

    expect(component.error).toBe('Email already exists');
  });

  it('should set loading false after request completes', () => {
    authSpy.register.and.returnValue(
      of({
        message: 'ok',
        email: 'a@b.com',
        userId: '1',
        role: 'PATIENT', // ✅ FIXED
      })
    );

    component.onRegister();

    expect(component.loading).toBeFalse();
  });

  it('should clear errors before each attempt', () => {
    component.error = 'old error';
    component.fieldErrors = { email: 'bad' };

    authSpy.register.and.returnValue(
      of({
        message: 'ok',
        email: 'a@b.com',
        userId: '1',
        role: 'PATIENT', // ✅ FIXED
      })
    );

    component.onRegister();

    expect(component.error).toBe('');
    expect(component.fieldErrors).toEqual({});
  });

  it('should omit phone from payload when blank', () => {
    authSpy.register.and.returnValue(
      of({
        message: 'ok',
        email: 'a@b.com',
        userId: '1',
        role: 'PATIENT', // ✅ FIXED
      })
    );

    component.phone = '';

    component.onRegister();

    const call = authSpy.register.calls.mostRecent().args[0];
    expect(call.phone).toBeUndefined();
  });
});