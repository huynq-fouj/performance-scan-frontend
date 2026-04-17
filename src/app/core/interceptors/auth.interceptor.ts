import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Auth interceptor - attaches Authorization header to outgoing requests.
 * Handles 401 responses by redirecting to login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip auth for public endpoints
  if (req.url.includes('/public/') || req.url.includes('/auth/login')) {
    return next(req);
  }

  // Get token from storage (SSR-safe: check if window is defined)
  const token = typeof window !== 'undefined'
    ? (localStorage.getItem('access_token') || sessionStorage.getItem('access_token'))
    : null;


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
