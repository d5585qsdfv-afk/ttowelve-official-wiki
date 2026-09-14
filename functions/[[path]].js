// Cloudflare Pages Function entrypoint for the latest Worker archive.
// The same Worker module is used by Sites version 36, so the public Pages
// domain serves the identical UI, data fallback, and API routes.
import worker from '../dist/server/index.js';

// Keep the cinematic Worker archive and its API as the primary surface, while
// allowing the static Next.js portal pages to be served by Cloudflare Pages.
const workerPaths = new Set([
  '/',
  '/app.js',
  '/favicon.svg',
  '/entry-metadata.js',
  '/weapon-metadata.js',
  '/pin-state.js',
  '/tagging.js',
  '/supabase-bridge.js',
]);

function usesWorker(pathname) {
  return workerPaths.has(pathname) || pathname.startsWith('/assets/') || pathname === '/api/entries';
}

export async function onRequest(context) {
  const pathname = new URL(context.request.url).pathname;
  if (usesWorker(pathname)) return worker.fetch(context.request, context.env, context);
  return context.next();
}
