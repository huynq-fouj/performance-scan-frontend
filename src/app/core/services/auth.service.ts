import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { AuthData, LoginRequest, RegisterRequest } from '../models/auth.model';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private apiUrl = environment.apiUrl + '/auth';

  register(data: RegisterRequest): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        if (res.data?.accessToken) {
          this.setToken(res.data.accessToken);
        }
      })
    );
  }

  login(data: LoginRequest): Observable<ApiResponse<AuthData>> {
    return this.http.post<ApiResponse<AuthData>>(`${this.apiUrl}/login`, data).pipe(
      tap((res) => {
        if (res.data?.accessToken) {
          this.setToken(res.data.accessToken, data.remember);
        }
      })
    );
  }

  logout() {
    this.removeToken();
    this.cacheService.clear();
  }


  private setToken(token: string, remember: boolean = false) {
    if (typeof window !== 'undefined') {
      this.removeToken(); // Clear previous tokens from both storages
      if (remember) {
        localStorage.setItem('access_token', token);
      } else {
        sessionStorage.setItem('access_token', token);
      }
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }
    return null;
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

