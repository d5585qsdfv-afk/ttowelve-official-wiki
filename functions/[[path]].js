// Cloudflare Pages Function entrypoint for the latest Worker archive.
// The same Worker module is used by Sites version 36, so the public Pages
// domain serves the identical UI, data fallback, and API routes.
import worker from '../dist/server/index.js';

export async function onRequest(context) {
  // Pages authenticates through Supabase, never through client-supplied Sites headers.
  const request = new Request(context.request);
  request.headers.delete('oai-authenticated-user-id');
  request.headers.delete('oai-authenticated-user-email');
  return worker.fetch(request, context.env, context);
}
