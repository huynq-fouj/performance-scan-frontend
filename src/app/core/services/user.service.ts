import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { User } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { CACHE_ENABLED, CACHE_KEY, CACHE_STORAGE, CACHE_TTL } from '../tokens/cache.tokens';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/users';

  currentUser = signal<User | null>(null);

  getOwnerInfo(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/owner-info`, {
      context: new HttpContext()
        .set(CACHE_ENABLED, true)
        .set(CACHE_TTL, 3600000)
        .set(CACHE_STORAGE, 'session')
        .set(CACHE_KEY, 'owner-info')
    }).pipe(
      tap(res => {
        if (res.status === 'success' && res.data) {
          this.currentUser.set(res.data);
        }
      })
    );
  }

  updateProfile(data: { fullName: string; avatar?: string }): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.apiUrl}/profile`, data).pipe(
      tap(res => {
        if (res.status === 'success' && res.data) {
          // Update the user signal
          this.currentUser.set(res.data);
          
          // Force invalidate cache since we updated the profile
          sessionStorage.removeItem('api_cache_owner-info');
        }
      })
    );
  }

  changePassword(data: any): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/password`, data);
  }
  clearUser() {
    this.currentUser.set(null);
  }
}
