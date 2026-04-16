import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * API interceptor - prepends base API URL to relative requests
 * and sets default headers.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Only modify relative URLs (not absolute URLs starting with http)
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const apiUrl = environment.apiUrl.replace(/\/+$/, ''); // Remove trailing slash
  const url = req.url.startsWith('/') ? req.url : `/${req.url}`;

  const clonedReq = req.clone({
    url: `${apiUrl}${url}`,
    setHeaders: {
      'Content-Type': req.headers.has('Content-Type')
        ? req.headers.get('Content-Type')!
        : 'application/json',
      Accept: 'application/json',
    },
  });

  return next(clonedReq);
};
