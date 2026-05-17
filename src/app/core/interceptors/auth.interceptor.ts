import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('medibook_token');

  // FIX: attach token to every request that goes to our API
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isAuthEndpoint = req.url.includes('/api/auth/login') ||
                             req.url.includes('/api/auth/register') ||
                             req.url.includes('/api/auth/send-verification') ||
                             req.url.includes('/api/auth/verify-email');

      // FIX: treat 401 from any protected endpoint as a session expiry
      if (err.status === 401 && token && !isAuthEndpoint) {
        console.warn('[AuthInterceptor] 401 on', req.url, '— clearing session and redirecting to login');
        localStorage.removeItem('medibook_token');
        localStorage.removeItem('medibook_user');
        router.navigate(['/login']);
      }

      // DEV HELP: log unexpected 404s on /api paths so they're easy to spot.
      // Exclude /providers/my/ — a 404 there just means the provider hasn't
      // created their profile yet and is handled by redirecting to profile-setup.
      const isExpected404 = req.url.includes('/api/providers/my/');
      if (err.status === 404 && req.url.includes('/api/') && !isExpected404) {
        console.error('[AuthInterceptor] 404 on API call:', req.method, req.url,
          '| Token present:', !!token,
          '| Auth header sent:', !!authReq.headers.get('Authorization'));
      }

      return throwError(() => err);
    })
  );
};