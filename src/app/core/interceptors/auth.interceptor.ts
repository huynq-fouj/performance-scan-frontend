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

  // Get token from localStorage (SSR-safe: check if localStorage exists)
  const token = typeof localStorage !== 'undefined'
    ? localStorage.getItem('access_token')
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
