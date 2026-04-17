import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpResponse } from '@angular/common/http';
import { CacheStorageType } from '../tokens/cache.tokens';

interface CacheEntry {
  data: any;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // Primary memory cache
  private memoryCache = new Map<string, CacheEntry>();

  // IndexedDB Configuration
  private readonly DB_NAME = 'AppCacheDB';
  private readonly STORE_NAME = 'httpCache';
  private readonly DB_VERSION = 1;

  constructor() {
    if (this.isBrowser) {
      this.initDB();
    }
  }

  // --- PUBLIC API ---

  /**
   * Get data from cache. Checks memory first, then other storages.
   */
  async get(key: string, storageType: CacheStorageType): Promise<any | null> {
    const now = Date.now();

    // 1. Check Memory
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (entry.expiry > now) {
        return entry.data;
      }
      this.delete(key);
      return null;
    }

    // 2. Check Disk Storage (Session or IndexedDB)
    if (!this.isBrowser) return null;

    let diskData: CacheEntry | null = null;

    if (storageType === 'session') {
      const serialized = sessionStorage.getItem(key);
      if (serialized) {
        diskData = JSON.parse(serialized);
      }
    } else if (storageType === 'indexeddb') {
      diskData = await this.getFromIndexedDB(key);
    }

    if (diskData) {
      if (diskData.expiry > now) {
        // Promote to memory
        this.memoryCache.set(key, diskData);
        return diskData.data;
      }
      this.delete(key, storageType);
    }

    return null;
  }

  /**
   * Set data to cache. Always saves to memory immediately, and saves to disk in background.
   */
  set(key: string, data: any, ttl: number, storageType: CacheStorageType): void {
    const entry: CacheEntry = {
      data,
      expiry: Date.now() + ttl
    };

    // Always save to memory (Sync)
    this.memoryCache.set(key, entry);

    if (!this.isBrowser) return;

    // Save to disk in background (No await)
    if (storageType === 'session') {
      try {
        sessionStorage.setItem(key, JSON.stringify(entry));
      } catch (e) {
        console.error('SessionStorage Set Error', e);
      }
    } else if (storageType === 'indexeddb') {
      this.setInIndexedDB(key, entry);
    }
  }

  /**
   * Remove a specific entry from all storages by its URL/Key.
   */
  clearByUrl(url: string, storageType?: CacheStorageType): void {
    this.delete(url, storageType);
  }

  /**
   * Remove a specific entry from all storages.
   */
  delete(key: string, storageType?: CacheStorageType): void {
    this.memoryCache.delete(key);

    if (!this.isBrowser) return;

    sessionStorage.removeItem(key);
    
    if (storageType === 'indexeddb' || !storageType) {
      this.deleteFromIndexedDB(key);
    }
  }

  /**
   * Clear all cache.
   */
  clear(storageType?: CacheStorageType): void {
    this.memoryCache.clear();

    if (!this.isBrowser) return;

    if (!storageType || storageType === 'session') {
      sessionStorage.clear();
    }

    if (!storageType || storageType === 'indexeddb') {
      this.clearIndexedDB();
    }
  }


  // --- INDEXED DB WRAPPER (Pure JS) ---

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };

      request.onsuccess = (event: any) => resolve(event.target.result);
      request.onerror = (event: any) => reject(event.target.error);
    });
  }

  private async getFromIndexedDB(key: string): Promise<CacheEntry | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB Get Error', e);
      return null;
    }
  }

  private async setInIndexedDB(key: string, entry: CacheEntry): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put(entry, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB Set Error', e);
    }
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB Delete Error', e);
    }
  }

  private async clearIndexedDB(): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('IndexedDB Clear Error', e);
    }
  }
}
