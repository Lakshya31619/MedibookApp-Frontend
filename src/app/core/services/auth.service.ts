import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthSession, LoginRequest, RegisterRequest, User, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'medibook_token';
  private readonly USER_KEY = 'medibook_user';
  private base = environment.authServiceUrl;

  currentUser = signal<User | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  // ── Public API ──────────────────────────────────────────────────────────────

  register(body: RegisterRequest): Observable<{ message: string; userId: string; email: string; role: string }> {
    return this.http.post<{ message: string; userId: string; email: string; role: string }>(
      `${this.base}/auth/register`, body
    );
  }

  login(body: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.base}/auth/login`, body).pipe(
      tap(session => this.saveSession(session))
    );
  }

  logout(): void {
    this.http.post(`${this.base}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getProfile(userId: string): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/profile/${userId}`);
  }

  updateProfile(userId: string, body: { fullName?: string; phone?: string; profilePicUrl?: string }): Observable<{ message: string; user: User }> {
    return this.http.put<{ message: string; user: User }>(`${this.base}/auth/profile/${userId}`, body).pipe(
      tap(res => {
        const updated = { ...this.currentUser()!, ...res.user };
        this.currentUser.set(updated);
        localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
      })
    );
  }

  changePassword(body: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.base}/auth/password`, body);
  }

  deactivateAccount(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/auth/deactivate/${userId}`);
  }

  getAdminUsers(role?: string): Observable<User[]> {
    const params = role ? `?role=${role}` : '';
    return this.http.get<User[]>(`${this.base}/auth/admin/users${params}`);
  }

  // ── OAuth2 ──────────────────────────────────────────────────────────────────

  handleOAuth2Callback(token: string): void {
    try {
      const payload = this.decodeJwt(token);
      const user: User = {
        userId: String(payload['userId'] ?? ''),
        fullName: (payload['fullName'] as string) || (payload['name'] as string) || '',
        email: (payload['sub'] as string),
        role: payload['role'] as UserRole,
        active: true,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      this.currentUser.set(user);
      this.redirectByRole(user.role);
    } catch {
      this.router.navigate(['/login']);
    }
  }

  // ── Session Helpers ─────────────────────────────────────────────────────────

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get role(): UserRole | null {
    return this.currentUser()?.role ?? null;
  }

  redirectByRole(role: UserRole): void {
    const map: Record<UserRole, string> = {
      PATIENT: '/patient/dashboard',
      PROVIDER: '/provider/dashboard',
      ADMIN: '/admin/dashboard',
    };
    this.router.navigate([map[role]]);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private saveSession(session: AuthSession): void {
    localStorage.setItem(this.TOKEN_KEY, session.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(session.user));
    this.currentUser.set(session.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private decodeJwt(token: string): Record<string, unknown> {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  }
}