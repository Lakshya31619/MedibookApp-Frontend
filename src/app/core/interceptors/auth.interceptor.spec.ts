import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should attach Authorization header when token is present', () => {
    localStorage.setItem('medibook_token', 'my-jwt-token');

    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-jwt-token');
    req.flush({});
  });

  it('should NOT attach Authorization header when no token', () => {
    http.get('/api/test').subscribe();

    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should navigate to /login on 401 for protected endpoints', () => {
    localStorage.setItem('medibook_token', 'expired-token');

    http.get('/api/appointments').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/appointments');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    expect(localStorage.getItem('medibook_token')).toBeNull();
  });

  it('should NOT redirect to /login on 401 for /api/auth/login', () => {
    localStorage.setItem('medibook_token', 'some-token');

    http.post('/api/auth/login', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ message: 'Bad credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should NOT redirect to /login on 401 for /api/auth/register', () => {
    localStorage.setItem('medibook_token', 'some-token');

    http.post('/api/auth/register', {}).subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/auth/register');
    req.flush({ message: 'Error' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should NOT redirect on 401 when there is no stored token', () => {
    // No token in localStorage — unauthenticated request

    http.get('/api/appointments').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/appointments');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should pass through non-401 errors without redirecting', () => {
    localStorage.setItem('medibook_token', 'token');

    http.get('/api/appointments').subscribe({ error: () => {} });

    const req = httpMock.expectOne('/api/appointments');
    req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});