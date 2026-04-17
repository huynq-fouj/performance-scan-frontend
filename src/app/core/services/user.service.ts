import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import { User } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';
import { CACHE_ENABLED, CACHE_STORAGE, CACHE_TTL } from '../tokens/cache.tokens';

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
    }).pipe(
      tap(res => {
        if (res.status === 'success' && res.data) {
          this.currentUser.set(res.data);
        }
      })
    );
  }


  clearUser() {
    this.currentUser.set(null);
  }
}
