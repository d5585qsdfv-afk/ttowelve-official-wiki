import { defaultEntries } from './data.js';
import { renderFavicon, renderPage } from './page.js';
import { clientSource } from './client-asset.generated.js';
import { assets } from './assets.generated.js';
import { normalizeEnemyEntry, updateEnemyBody } from './entry-metadata.js';

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const CATEGORY_SET = new Set(['weapons', 'weaponItems', 'cards', 'medicines', 'jobs', 'emblems', 'rings', 'enemies', 'other']);
const ACCENT_SET = new Set(['lime', 'amber', 'silver', 'rose', 'violet', 'ice', 'sky', 'red', 'teal']);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function userFrom(request) {
  const userId = request.headers.get('oai-authenticated-user-id');
  const email = request.headers.get('oai-authenticated-user-email');
  const url = new URL(request.url);
  if (userId) return { userId, email: email || '' };
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return { userId: 'local-preview', email: 'local@preview' };
  return null;
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function toEntry(row) {
  return {
    id: row.id, game: row.game, category: row.category, title: row.title,
    subtitle: row.subtitle, summary: row.summary, body: row.body,
    tags: JSON.parse(row.tags_json || '[]'), accent: row.accent,
    sortOrder: row.sort_order, revision: row.revision, updatedAt: row.updated_at,
    source: 'クラウド編集'
  };
}

async function listEntries(env) {
  if (!env.DB) return defaultEntries;
  const result = await env.DB.prepare('SELECT * FROM entries WHERE is_deleted = 0 ORDER BY sort_order, title').all();
  const stored = new Map((result.results || []).map(row => [row.id, normalizeEnemyEntry(toEntry(row))]));
  for (const entry of defaultEntries) if (!stored.has(entry.id)) stored.set(entry.id, entry);
  return [...stored.values()];
}

async function saveEntry(request, env) {
  const user = userFrom(request);
  if (!user) return json({ error: '編集にはログインが必要です。' }, 401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: '送信元を確認できません。' }, 403);
  if (!env.DB) return json({ error: 'クラウドデータベースを利用できません。' }, 503);
  let input;
  try { input = await request.json(); } catch { return json({ error: '入力内容を読み取れません。' }, 400); }
  const title = cleanText(input.title, 80);
  const category = CATEGORY_SET.has(input.category) ? input.category : '';
  if (!title || !category) return json({ error: '名前とカテゴリーは必須です。' }, 400);
  const accent = ACCENT_SET.has(input.accent) ? input.accent : 'lime';
  const id = cleanText(input.id, 100) || `${category}-${crypto.randomUUID()}`;
  const revision = Number.isInteger(input.revision) && input.revision >= 0 ? input.revision : 0;
  const existing = await env.DB.prepare('SELECT revision FROM entries WHERE id = ?').bind(id).first();
  if (existing && existing.revision !== revision) return json({ conflict: true, currentRevision: existing.revision }, 409);
  const now = Date.now();
  const entry = {
    id, game: 'ten-saviors', category, title,
    subtitle: cleanText(input.subtitle, 120), summary: cleanText(input.summary, 240),
    body: cleanText(input.body, 6000), tags: Array.isArray(input.tags) ? input.tags.map(x => cleanText(x, 40)).filter(Boolean).slice(0, 12) : [],
    accent, sortOrder: existing ? 0 : now, revision: revision + 1, updatedAt: now, source: 'クラウド編集'
  };
  if (category === 'enemies' && input.enemyClass !== undefined) {
    entry.body = updateEnemyBody(entry.body, {
      classification: cleanText(input.enemyClass, 40),
      chapter: cleanText(input.enemyChapter, 100),
      location: cleanText(input.enemyLocation, 120),
    });
  }
  const normalizedEntry = normalizeEnemyEntry(entry);
  await env.DB.prepare(`INSERT INTO entries (id, game, category, title, subtitle, summary, body, tags_json, accent, sort_order, revision, is_deleted, updated_at, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(id) DO UPDATE SET category=excluded.category,title=excluded.title,subtitle=excluded.subtitle,summary=excluded.summary,body=excluded.body,tags_json=excluded.tags_json,accent=excluded.accent,revision=excluded.revision,is_deleted=0,updated_at=excluded.updated_at,updated_by=excluded.updated_by`)
    .bind(normalizedEntry.id, normalizedEntry.game, normalizedEntry.category, normalizedEntry.title, normalizedEntry.subtitle, normalizedEntry.summary, normalizedEntry.body, JSON.stringify(normalizedEntry.tags), normalizedEntry.accent, normalizedEntry.sortOrder, normalizedEntry.revision, now, user.userId).run();
  return json({ saved: true, entry: normalizedEntry });
}

async function handle(request, env) {
  const url = new URL(request.url);
  const asset = Object.hasOwn(assets, url.pathname) ? assets[url.pathname] : null;
  if (asset) {
    if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 });
    const bytes = request.method === 'HEAD' ? null : Uint8Array.from(atob(asset.base64), c => c.charCodeAt(0));
    return new Response(bytes, { headers: { 'content-type': asset.type, 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
  }
  if (url.pathname.startsWith('/assets/')) return new Response('Image not found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8', 'x-content-type-options': 'nosniff' } });
  if (url.pathname === '/favicon.svg') return new Response(renderFavicon(), { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
  if (url.pathname === '/app.js') return new Response(request.method === 'HEAD' ? null : clientSource, { headers: { 'content-type': 'text/javascript; charset=utf-8', 'cache-control': 'no-cache' } });
  if (url.pathname === '/api/entries' && request.method === 'GET') {
    try { return json({ entries: await listEntries(env), authenticated: !!userFrom(request) }); }
    catch (error) { return json({ error: '図鑑情報を読み込めません。', detail: String(error?.message || '') }, 500); }
  }
  if (url.pathname === '/api/entries' && request.method === 'POST') return saveEntry(request, env);
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  return new Response(request.method === 'HEAD' ? null : renderPage(), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });
}

export default { fetch: handle };
