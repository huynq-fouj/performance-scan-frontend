import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';

import { provideHotToastConfig } from '@ngxpert/hot-toast';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { cacheInterceptor } from './core/interceptors/cache.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiInterceptor, cacheInterceptor, authInterceptor]),
    ),
    provideHotToastConfig({
      duration: 3000,
      position: 'top-right'
    }),
  ],
};

