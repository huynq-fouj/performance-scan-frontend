import { Injectable, inject, PLATFORM_ID, InjectionToken, Optional } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// REQUEST token is provided by @angular/ssr during server rendering
export const REQUEST = new InjectionToken<any>('REQUEST');

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private platformId = inject(PLATFORM_ID);
  private request = inject(REQUEST, { optional: true });
  
  getCookie(name: string): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const nameLenPlus = (name.length + 1);
      return document.cookie
        .split(';')
        .map(c => c.trim())
        .filter(cookie => {
          return cookie.substring(0, nameLenPlus) === `${name}=`;
        })
        .map(cookie => {
          return decodeURIComponent(cookie.substring(nameLenPlus));
        })[0] || null;
    } else if (this.request && this.request.headers) {
      // Server-side extraction from Node request headers
      const cookies = this.request.headers.cookie;
      if (cookies) {
        const match = cookies.match(new RegExp('(^|; )' + name + '=([^;]*)'));
        return match ? decodeURIComponent(match[2]) : null;
      }
    }
    return null;
  }

  setCookie(name: string, value: string, days: number = 7) {
    if (isPlatformBrowser(this.platformId)) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = "expires=" + date.toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/;SameSite=Lax`;
    }
  }

  deleteCookie(name: string) {
    if (isPlatformBrowser(this.platformId)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  }
}
