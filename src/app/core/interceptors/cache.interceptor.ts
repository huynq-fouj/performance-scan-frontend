import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, tap, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { 
  CACHE_ENABLED, 
  BYPASS_CACHE, 
  CACHE_TTL, 
  CACHE_STORAGE, 
  CACHE_KEY,
  CLEAR_CACHE
} from '../tokens/cache.tokens';

/**
 * Functional Cache Interceptor.
 * Handles caching for GET requests based on HttpContext configuration.
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // 2. Read HttpContext configuration
  const isEnabled = req.context.get(CACHE_ENABLED);
  const skipCache = req.context.get(BYPASS_CACHE);
  const clearCache = req.context.get(CLEAR_CACHE);
  const ttl = req.context.get(CACHE_TTL);
  const storageType = req.context.get(CACHE_STORAGE);
  const customKey = req.context.get(CACHE_KEY);

  // If cache is not enabled for this request, just pass through
  if (!isEnabled && !clearCache) {
    return next(req);
  }

  const cacheKey = customKey || req.urlWithParams;
  const cacheService = inject(CacheService);

  // 3. Logic for CLEAR_CACHE (Delete from ALL storages then proceed without awaiting)
  if (clearCache) cacheService.delete(cacheKey);

  if(skipCache) {
    return next(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse && isEnabled) {
          cacheService.set(cacheKey, event, ttl, storageType);
        }
      })
    );
  }


  // 4. Check Cache (Async because of IndexedDB possibility)
  // Use from(Promise) to integrate with RxJS pipeline
  return from(cacheService.get(cacheKey, storageType)).pipe(
    switchMap(cachedResponse => {
      if (cachedResponse) {
        // Reconstruct HttpResponse from cached data
        const response = new HttpResponse({
          body: cachedResponse.body,
          headers: cachedResponse.headers,
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          url: cachedResponse.url
        });
        return of(response);
      }

      // Cache Miss: Fetch and Store
      return next(req).pipe(
        tap(event => {
          if (event instanceof HttpResponse) {
            // Note: We only store the serializable parts of the response
            const serializableResponse = {
              body: event.body,
              headers: event.headers,
              status: event.status,
              statusText: event.statusText,
              url: event.url
            };
            cacheService.set(cacheKey, serializableResponse, ttl, storageType);
          }
        })
      );
    })
  );
};
