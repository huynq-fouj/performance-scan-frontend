import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { DashboardSummary, ExecutiveReport } from '../models/dashboard.model';
import { ApiResponse } from '../models/api-response.model';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/dashboard';

  getSummary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${this.apiUrl}/summary`);
  }

  getAnalytics(query?: { device?: string; days?: number }): Observable<ApiResponse<ExecutiveReport>> {
    let params = new HttpParams();
    if (query) {
      if (query.device && query.device !== 'all') params = params.set('device', query.device);
      if (query.days) params = params.set('days', query.days.toString());
    }
    return this.http.get<ApiResponse<ExecutiveReport>>(`${this.apiUrl}/analytics`, { params });
  }
}
