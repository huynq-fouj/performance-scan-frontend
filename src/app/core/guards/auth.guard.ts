import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { isPlatformServer } from '@angular/common';

/**
 * Auth guard - prevents unauthorized access to protected routes.
 * Redirects to login with the current URL as returnUrl.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (authService.isLoggedIn()) {
    return true;
  }

  // ON SERVER: We stay neutral. If we don't see a token on the server, we don't 
  // redirect to login to avoid the "flash" of the login page.
  // The client will perform the definitive check and redirect if needed.
  if (isPlatformServer(platformId)) {
    return true;
  }

  // ON CLIENT: Perform definitive redirect to login page
  return router.createUrlTree(['/auth/login'], { 
    queryParams: { returnUrl: state.url } 
  });
};
