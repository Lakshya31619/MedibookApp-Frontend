import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, shareReplay, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProviderResponse, ProviderSummary, ProviderRegisterRequest, SpecializationCount } from '../models';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private base = `${environment.apiUrl}/api/providers`;

  // Cache the result of getMyProfile so every component (dashboard, sidebar,
  // etc.) shares a single network call per session.
  // undefined = not fetched yet | null = fetched, no profile exists | ProviderResponse = fetched and exists
  private myProfileCache: ProviderResponse | null | undefined = undefined;
  // In-flight request shared across simultaneous callers so we never fire two
  // concurrent GET /my/:id calls (e.g. dashboard + sidebar both mounting at once).
  private myProfileRequest$: Observable<ProviderResponse> | null = null;

  constructor(private http: HttpClient) {}

  // Public
  getAll(): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}`);
  }

  getById(id: number): Observable<ProviderResponse> {
    return this.http.get<ProviderResponse>(`${this.base}/${id}`);
  }

  search(q: string): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/search`, { params: { q } });
  }

  bySpecialization(spec: string): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/specialization/${spec}`);
  }

  byLocation(city: string): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/location`, { params: { city } });
  }

  // Provider/Admin
  register(body: ProviderRegisterRequest): Observable<{ message: string; providerId: number; verificationStatus: string }> {
    return this.http.post<{ message: string; providerId: number; verificationStatus: string }>(`${this.base}/register`, body);
  }

  getMyProfile(userId: number): Observable<ProviderResponse> {
    // Already have a resolved value in cache
    if (this.myProfileCache !== undefined) {
      if (this.myProfileCache === null) {
        return throwError(() => ({ status: 404 }));
      }
      return of(this.myProfileCache);
    }

    // FIX: Share one in-flight request so simultaneous callers (sidebar + dashboard)
    // never fire two concurrent GET /my/:id requests — which caused duplicate 404
    // console errors on every page load before a profile existed.
    if (!this.myProfileRequest$) {
      this.myProfileRequest$ = this.http
        .get<ProviderResponse>(`${this.base}/my/${userId}`)
        .pipe(
          tap(profile => {
            this.myProfileCache = profile;
            this.myProfileRequest$ = null;
          }),
          catchError(err => {
            if (err.status === 404) {
              // Mark cache so future callers skip the network entirely
              this.myProfileCache = null;
            }
            this.myProfileRequest$ = null;
            return throwError(() => err);
          }),
          shareReplay(1)
        );
    }
    return this.myProfileRequest$;
  }

  // Call this after a successful register() so the cache is refreshed.
  clearMyProfileCache(): void {
    this.myProfileCache = undefined;
    this.myProfileRequest$ = null;
  }

  // Call this to mark that we know no profile exists yet (avoids re-fetching).
  markNoProfile(): void {
    this.myProfileCache = null;
  }

  update(id: number, body: Partial<ProviderRegisterRequest>): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/${id}`, body);
  }

  setAvailability(id: number, status: boolean): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/${id}/availability`, null, { params: { status: String(status) } });
  }

  // Admin
  adminGetAll(): Observable<ProviderResponse[]> {
    return this.http.get<ProviderResponse[]>(`${this.base}/admin/all`);
  }

  adminGetPending(): Observable<ProviderResponse[]> {
    return this.http.get<ProviderResponse[]>(`${this.base}/admin/pending`);
  }

  approve(id: number): Observable<{ message: string; providerId: number; verificationStatus: string }> {
    return this.http.put<{ message: string; providerId: number; verificationStatus: string }>(`${this.base}/${id}/verify`, null);
  }

  reject(id: number, reason: string): Observable<{ message: string; providerId: number; verificationStatus: string; reason: string }> {
    return this.http.post<{ message: string; providerId: number; verificationStatus: string; reason: string }>(`${this.base}/${id}/reject`, { reason });
  }

  unverify(id: number): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/${id}/unverify`, null);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  getSpecializationAnalytics(): Observable<SpecializationCount[]> {
    return this.http.get<SpecializationCount[]>(`${this.base}/analytics/specializations`);
  }
}