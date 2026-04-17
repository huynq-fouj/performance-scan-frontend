import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth guard - prevents unauthorized access to protected routes.
 * Redirects to login with the current URL as returnUrl.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Redirect to login page with matching return url
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  
  return false;
};
