import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthSession, LoginRequest, RegisterRequest, User, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'medibook_token';
  private readonly USER_KEY = 'medibook_user';
  private base = `${environment.apiUrl}/api/auth`;
  private profileCache$ = new Map<string, Observable<User>>();
  private adminUsersCache$ = new Map<string, Observable<User[]>>();

  currentUser = signal<User | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  register(body: RegisterRequest): Observable<{ message: string; userId: string; email: string; role: string }> {
    return this.http.post<{ message: string; userId: string; email: string; role: string }>(
      `${this.base}/register`, body
    );
  }

  sendVerificationCode(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/send-verification`, { email });
  }

  verifyEmail(email: string, code: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/verify-email`, { email, code });
  }

  login(body: LoginRequest): Observable<AuthSession> {
    return this.http.post<AuthSession>(`${this.base}/login`, body).pipe(
      tap(session => this.saveSession(session)),
      // Fetch full profile after login to ensure all user data is loaded
      // (not just what's in the login response)
    );
  }

  logout(): void {
    this.http.post(`${this.base}/logout`, {}).subscribe({ error: () => {} });
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getProfile(userId: number): Observable<User> {
    const key = `profile:${userId}`;
    if (!this.profileCache$.has(key)) {
      this.profileCache$.set(
        key,
        this.http.get<User>(`${this.base}/profile/${userId}`).pipe(
          tap(user => {
            console.log('[AuthService] getProfile() response:', user);
            console.log('[AuthService] fullName in response:', user.fullName);
          }),
          shareReplay(1)
        )
      );
    }
    return this.profileCache$.get(key)!;
  }

  updateProfile(userId: number, body: { fullName?: string; phone?: string; profilePicUrl?: string }): Observable<{ message: string; user: User }> {
    this.clearCache();
    return this.http.put<{ message: string; user: User }>(`${this.base}/profile/${userId}`, body).pipe(
      tap(res => {
        console.log('[AuthService] updateProfile() response:', res);
        console.log('[AuthService] response.user:', res.user);
        console.log('[AuthService] response.user.fullName:', res.user?.fullName);
        
        // Merge: start from current cached user, apply the request fields we
        // sent (guaranteed to reflect what the user typed), then overlay any
        // extra fields the server returned.  This ensures fullName/phone are
        // always updated even if the backend omits them from the response body.
        const updated: User = {
          ...this.currentUser()!,
          ...(body.fullName !== undefined    ? { fullName:      body.fullName                          } : {}),
          ...(body.phone !== undefined       ? { phone:         body.phone || undefined                } : {}),
          ...(body.profilePicUrl !== undefined ? { profilePicUrl: body.profilePicUrl || undefined      } : {}),
          ...(res.user ?? {}),
        };
        
        console.log('[AuthService] Merged updated user:', updated);
        console.log('[AuthService] Updated fullName:', updated.fullName);
        
        this.currentUser.set(updated);
        localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
        
        console.log('[AuthService] currentUser signal updated and localStorage saved');
      })
    );
  }

  changePassword(body: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    this.clearCache();
    return this.http.put<{ message: string }>(`${this.base}/password`, body);
  }

  deactivateAccount(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/deactivate/${userId}`);
  }

  getAdminUsers(role?: string): Observable<User[]> {
    const key = `admin:users:${role || 'all'}`;
    if (!this.adminUsersCache$.has(key)) {
      const params = role ? `?role=${role}` : '';
      this.adminUsersCache$.set(
        key,
        this.http.get<User[]>(`${this.base}/admin/users${params}`).pipe(shareReplay(1))
      );
    }
    return this.adminUsersCache$.get(key)!;
  }

  /**
   * Safely merge partial updates into the cached currentUser signal + localStorage.
   * Use this from components instead of writing currentUser.set() directly.
   */
  updateCachedUser(partial: Partial<User>): void {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...partial };
    this.currentUser.set(updated);
    localStorage.setItem(this.USER_KEY, JSON.stringify(updated));
  }

  /**
   * Save a complete user profile to both signal and localStorage.
   * Used when syncing profile from backend after login.
   */
  setUserProfile(user: User): void {
    this.currentUser.set(user);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  handleOAuth2Callback(token: string): void {
    try {
      const payload = this.decodeJwt(token);
      const user: User = {
        userId: Number(payload['userId'] ?? 0),
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

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private clearCache(): void {
    this.profileCache$.clear();
    this.adminUsersCache$.clear();
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