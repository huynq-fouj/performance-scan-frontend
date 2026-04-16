/**
 * SSR Polyfills - Prevent 'window/document/global is not defined' errors
 * These must be set BEFORE any Angular imports
 */
const _global = globalThis as any;

if (typeof _global.window === 'undefined') {
  _global.window = _global;
}

if (typeof _global.document === 'undefined') {
  _global.document = {
    createElement: () => ({}),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { style: {} },
    head: { appendChild: () => {}, removeChild: () => {} },
    documentElement: { style: {} },
  };
}

if (typeof _global.navigator === 'undefined') {
  _global.navigator = {
    userAgent: 'node',
    platform: 'server',
    language: 'en',
  };
}

if (typeof _global.localStorage === 'undefined') {
  const storage: Record<string, string> = {};
  _global.localStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    get length() { return Object.keys(storage).length; },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  };
}

if (typeof _global.sessionStorage === 'undefined') {
  const storage: Record<string, string> = {};
  _global.sessionStorage = {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => { storage[key] = value; },
    removeItem: (key: string) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); },
    get length() { return Object.keys(storage).length; },
    key: (index: number) => Object.keys(storage)[index] ?? null,
  };
}

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => res.send(html))
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
