import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * API interceptor - prepends base API URL to relative requests
 * and sets default headers.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  // Only modify relative URLs (not absolute URLs starting with http)
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req);
  }

  const router = inject(Router);
  const authService = inject(AuthService);

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

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login'], { 
          queryParams: { returnUrl: router.url } 
        });
      }
      return throwError(() => error);
    })
  );
};
