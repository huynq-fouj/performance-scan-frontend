import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { isPlatformServer } from '@angular/common';

/**
 * Auth interceptor - attaches Authorization header to outgoing requests.
 * Handles 401 responses by redirecting to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);

  // Skip auth for public endpoints
  if (req.url.includes('/public/') || req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
    return next(req);
  }

  // Get token (AuthService handle both browser and server via cookies)
  // On server side, we might need to inject the Request object if it's not automatically available
  // In many Angular SSR setups, we provide the REQUEST token.
  const token = authService.getToken();

  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(clonedReq);
  }

  return next(req);
};
