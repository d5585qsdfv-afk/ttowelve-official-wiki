// Cloudflare Pages Function entrypoint for the latest Worker archive.
// The same Worker module is used by Sites version 36, so the public Pages
// domain serves the identical UI, data fallback, and API routes.
import worker from '../dist/server/index.js';

export async function onRequest(context) {
  return worker.fetch(context.request, context.env, context);
}
