import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProviderResponse, ProviderSummary, ProviderRegisterRequest, SpecializationCount } from '../models';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private base = `${environment.apiUrl}/api/providers`;

  constructor(private http: HttpClient) {}

  // Public
  getAll(): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}`);
  }

  getById(id: string): Observable<ProviderResponse> {
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
  register(body: ProviderRegisterRequest): Observable<{ message: string; providerId: string; verificationStatus: string }> {
    return this.http.post<{ message: string; providerId: string; verificationStatus: string }>(`${this.base}/register`, body);
  }

  getMyProfile(userId: string): Observable<ProviderResponse> {
    return this.http.get<ProviderResponse>(`${this.base}/my/${userId}`);
  }

  update(id: string, body: Partial<ProviderRegisterRequest>): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/${id}`, body);
  }

  setAvailability(id: string, status: boolean): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/${id}/availability`, null, { params: { status: String(status) } });
  }

  // Admin
  adminGetAll(): Observable<ProviderResponse[]> {
    return this.http.get<ProviderResponse[]>(`${this.base}/admin/all`);
  }

  adminGetPending(): Observable<ProviderResponse[]> {
    return this.http.get<ProviderResponse[]>(`${this.base}/admin/pending`);
  }

  approve(id: string): Observable<{ message: string; providerId: string; verificationStatus: string }> {
    return this.http.put<{ message: string; providerId: string; verificationStatus: string }>(`${this.base}/${id}/verify`, null);
  }

  reject(id: string, reason: string): Observable<{ message: string; providerId: string; verificationStatus: string; reason: string }> {
    return this.http.post<{ message: string; providerId: string; verificationStatus: string; reason: string }>(`${this.base}/${id}/reject`, { reason });
  }

  unverify(id: string): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/${id}/unverify`, null);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/${id}`);
  }

  getSpecializationAnalytics(): Observable<SpecializationCount[]> {
    return this.http.get<SpecializationCount[]>(`${this.base}/analytics/specializations`);
  }
}