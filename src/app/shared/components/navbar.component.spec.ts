import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../core/models';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'redirectByRole'], {
      role: 'PATIENT' as UserRole,
    });

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show Dashboard button when logged in', () => {
    authSpy.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });

  it('should show Sign In and Get Started links when not logged in', () => {
    authSpy.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sign In');
    expect(text).toContain('Get Started');
  });

  it('should call redirectByRole with current role on goToDashboard()', () => {
    component.goToDashboard();
    expect(authSpy.redirectByRole).toHaveBeenCalledWith('PATIENT');
  });

  it('should render MediBook brand text', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('MediBook');
  });

  it('should render Find Doctors link', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Find Doctors');
  });
});