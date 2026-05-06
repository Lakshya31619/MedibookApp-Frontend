import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { OAuth2CallbackComponent } from './oauth2-callback.component';
import { AuthService } from '../../core/services/auth.service';

describe('OAuth2CallbackComponent', () => {
  let component: OAuth2CallbackComponent;
  let fixture: ComponentFixture<OAuth2CallbackComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const makeRoute = (token: string | null) => ({
    snapshot: { queryParamMap: { get: (k: string) => (k === 'token' ? token : null) } },
  });

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['handleOAuth2Callback']);

    await TestBed.configureTestingModule({
      imports: [OAuth2CallbackComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: makeRoute('my-jwt-token') },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OAuth2CallbackComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call handleOAuth2Callback with the token on init', () => {
    expect(authSpy.handleOAuth2Callback).toHaveBeenCalledWith('my-jwt-token');
  });

  it('should navigate to /login when no token present', async () => {
    await TestBed.resetTestingModule();
    authSpy = jasmine.createSpyObj('AuthService', ['handleOAuth2Callback']);
    await TestBed.configureTestingModule({
      imports: [OAuth2CallbackComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: makeRoute(null) },
      ],
    }).compileComponents();
    const f2 = TestBed.createComponent(OAuth2CallbackComponent);
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    f2.componentInstance.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
    expect(authSpy.handleOAuth2Callback).not.toHaveBeenCalled();
  });

  it('should render a loading spinner', () => {
    expect(fixture.nativeElement.querySelector('.animate-spin')).toBeTruthy();
  });
});