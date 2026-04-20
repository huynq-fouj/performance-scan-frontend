import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { ScanRecord, CreateScanRequest } from '../models/scan.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class ScanService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/scans';

  isScanning = signal<boolean>(false);

  getScans(projectId: string, query?: { status?: string; page?: number; limit?: number; startDate?: string; endDate?: string }): Observable<ApiResponse<ScanRecord[]>> {
    let params = new HttpParams();
    if (query) {
      if (query.status && query.status !== 'all') params = params.set('status', query.status);
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);
    }
    return this.http.get<ApiResponse<ScanRecord[]>>(`${this.apiUrl}/project/${projectId}`, { params });
  }

  getScan(id: string): Observable<ApiResponse<ScanRecord>> {
    return this.http.get<ApiResponse<ScanRecord>>(`${this.apiUrl}/${id}`);
  }

  createScan(payload: CreateScanRequest, device: 'mobile' | 'desktop' = 'desktop'): Observable<ApiResponse<ScanRecord>> {
    return this.http.post<ApiResponse<ScanRecord>>(this.apiUrl, { ...payload, device });
  }

  cancelScan(id: string): Observable<ApiResponse<ScanRecord>> {
    return this.http.patch<ApiResponse<ScanRecord>>(`${this.apiUrl}/${id}/cancel`, {});
  }

  getAllScans(query?: { status?: string; projectId?: string; page?: number; limit?: number; startDate?: string; endDate?: string }): Observable<ApiResponse<ScanRecord[]>> {
    let params = new HttpParams();
    if (query) {
      if (query.status && query.status !== 'all') params = params.set('status', query.status);
      if (query.projectId) params = params.set('projectId', query.projectId);
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.startDate) params = params.set('startDate', query.startDate);
      if (query.endDate) params = params.set('endDate', query.endDate);
    }
    return this.http.get<ApiResponse<ScanRecord[]>>(`${this.apiUrl}/all`, { params });
  }

  deleteScan(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiUrl}/${id}/delete`, {});
  }

  importScan(projectId: string, jsonData: any): Observable<ApiResponse<ScanRecord>> {
    return this.http.post<ApiResponse<ScanRecord>>(`${this.apiUrl}/project/${projectId}/import`, jsonData);
  }
}
