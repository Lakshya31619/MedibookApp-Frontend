import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProviderResponse, ProviderSummary, ProviderRegisterRequest, SpecializationCount } from '../models';

@Injectable({ providedIn: 'root' })
export class ProviderService {
  private base = environment.providerServiceUrl;

  constructor(private http: HttpClient) {}

  // Public
  getAll(): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/providers`);
  }

  getById(id: string): Observable<ProviderResponse> {
    return this.http.get<ProviderResponse>(`${this.base}/providers/${id}`);
  }

  search(q: string): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/providers/search`, { params: { q } });
  }

  bySpecialization(spec: string): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/providers/specialization/${spec}`);
  }

  byLocation(city: string): Observable<ProviderSummary[]> {
    return this.http.get<ProviderSummary[]>(`${this.base}/providers/location`, { params: { city } });
  }

  // Provider/Admin
  register(body: ProviderRegisterRequest): Observable<{ message: string; providerId: string; verificationStatus: string }> {
    return this.http.post<{ message: string; providerId: string; verificationStatus: string }>(`${this.base}/providers/register`, body);
  }

  getMyProfile(userId: string): Observable<ProviderResponse> {
    return this.http.get<ProviderResponse>(`${this.base}/providers/my/${userId}`);
  }

  update(id: string, body: Partial<ProviderRegisterRequest>): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/providers/${id}`, body);
  }

  setAvailability(id: string, status: boolean): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/providers/${id}/availability`, null, { params: { status: String(status) } });
  }

  // Admin
  adminGetAll(): Observable<ProviderResponse[]> {
    return this.http.get<ProviderResponse[]>(`${this.base}/providers/admin/all`);
  }

  adminGetPending(): Observable<ProviderResponse[]> {
    return this.http.get<ProviderResponse[]>(`${this.base}/providers/admin/pending`);
  }

  approve(id: string): Observable<{ message: string; providerId: string; verificationStatus: string }> {
    return this.http.put<{ message: string; providerId: string; verificationStatus: string }>(`${this.base}/providers/${id}/verify`, null);
  }

  reject(id: string, reason: string): Observable<{ message: string; providerId: string; verificationStatus: string; reason: string }> {
    return this.http.post<{ message: string; providerId: string; verificationStatus: string; reason: string }>(`${this.base}/providers/${id}/reject`, { reason });
  }

  unverify(id: string): Observable<ProviderResponse> {
    return this.http.put<ProviderResponse>(`${this.base}/providers/${id}/unverify`, null);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/providers/${id}`);
  }

  getSpecializationAnalytics(): Observable<SpecializationCount[]> {
    return this.http.get<SpecializationCount[]>(`${this.base}/providers/analytics/specializations`);
  }
}
