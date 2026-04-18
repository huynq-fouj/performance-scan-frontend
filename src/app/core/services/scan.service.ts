import { Injectable, inject } from '@angular/core';
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

  getScans(projectId: string, status?: string): Observable<ApiResponse<ScanRecord[]>> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.http.get<ApiResponse<ScanRecord[]>>(`${this.apiUrl}/project/${projectId}`, { params });
  }

  getScan(id: string): Observable<ApiResponse<ScanRecord>> {
    return this.http.get<ApiResponse<ScanRecord>>(`${this.apiUrl}/${id}`);
  }

  createScan(payload: CreateScanRequest): Observable<ApiResponse<ScanRecord>> {
    return this.http.post<ApiResponse<ScanRecord>>(this.apiUrl, payload);
  }
}
