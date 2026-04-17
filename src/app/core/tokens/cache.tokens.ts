import { HttpContextToken } from '@angular/common/http';

export type CacheStorageType = 'memory' | 'session' | 'indexeddb';

/**
 * HttpContextToken to enable/disable cache for a request.
 * Default: false
 */
export const CACHE_ENABLED = new HttpContextToken<boolean>(() => false);

/**
 * HttpContextToken to bypass existing cache and fetch fresh data.
 * The fresh data will still be cached for future use.
 * Default: false
 */
export const BYPASS_CACHE = new HttpContextToken<boolean>(() => false);

/**
 * Time To Live (TTL) for the cached data in milliseconds.
 * Default: 5 minutes (300,000 ms)
 */
export const CACHE_TTL = new HttpContextToken<number>(() => 300000);

/**
 * The storage type to use for caching.
 * Note: Memory cache is ALWAYS used as the primary layer.
 * Default: 'memory'
 */
export const CACHE_STORAGE = new HttpContextToken<CacheStorageType>(() => 'memory');

/**
 * HttpContextToken to clear the existing cache for the current URL.
 * Useful when you want to ensure the next request is fresh and the old one is gone.
 * Default: false
 */
export const CLEAR_CACHE = new HttpContextToken<boolean>(() => false);

/**
 * A custom key for the cache. If not provided, the URL with params is used.
 */
export const CACHE_KEY = new HttpContextToken<string | null>(() => null);

