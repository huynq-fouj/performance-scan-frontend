import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';

/**
 * Check if the current platform is a browser.
 * Must be called within an injection context.
 */
export function isBrowser(): boolean {
  return isPlatformBrowser(inject(PLATFORM_ID));
}

/**
 * Check if the current platform is a server.
 * Must be called within an injection context.
 */
export function isServer(): boolean {
  return isPlatformServer(inject(PLATFORM_ID));
}
