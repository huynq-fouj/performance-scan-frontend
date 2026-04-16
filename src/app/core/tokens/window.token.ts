import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Injection token for the Window object.
 * Returns the window object on browser, undefined on server.
 * Usage: inject(WINDOW) in components/services.
 */
export const WINDOW = new InjectionToken<Window | undefined>('WindowToken', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);
    return isPlatformBrowser(platformId) ? window : undefined;
  },
});
