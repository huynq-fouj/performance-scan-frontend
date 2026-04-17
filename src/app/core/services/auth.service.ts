import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiResponse } from '../models/api-response.model';
import { AuthData, LoginRequest, RegisterRequest } from '../models/auth.model';
import { CacheService } from './cache.service';
import { CookieService } from './cookie.service';
import { PLATFORM_ID, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private cookieService = inject(CookieService);
  private platformId = inject(PLATFORM_ID);
  
  // We can inject the Request object here if needed, but for now we'll pass it to getToken if available
  // In Angular 18, we can also use TRANSFER_STATE or other mechanisms.
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
    // 1. Set cookie for SSR and persistence
    this.cookieService.setCookie('access_token', token, remember ? 30 : 1);
    
    // 2. Set localStorage/sessionStorage as backup/legacy storage for browser
    if (isPlatformBrowser(this.platformId)) {
      if (remember) {
        localStorage.setItem('access_token', token);
      } else {
        sessionStorage.setItem('access_token', token);
      }
    }
  }

  getToken(): string | null {
    // 1. Try Cookie first (available on both SSR and Browser)
    let token = this.cookieService.getCookie('access_token');
    
    // 2. Fallback to LocalStorage/SessionStorage if on browser
    if (!token && isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      
      // If found in storage but not in cookie, sync it back to cookie for next SSR cycle
      if (token) {
        this.cookieService.setCookie('access_token', token, 1);
      }
    }
    
    return token;
  }

  removeToken() {
    this.cookieService.deleteCookie('access_token');
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

