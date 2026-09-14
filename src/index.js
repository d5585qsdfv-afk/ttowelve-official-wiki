import { defaultEntries } from './data.js';
import { renderFavicon, renderPage } from './page.js';
import { clientSource } from './client-asset.generated.js';
import { assets } from './assets.generated.js';
import { normalizeEnemyEntry, updateEnemyBody } from './entry-metadata.js';
import { normalizeWeaponEntry } from './weapon-metadata.js';

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

function supabaseConfig(env) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return typeof url === 'string' && url.startsWith('https://') && typeof anonKey === 'string' && anonKey.length > 20
    ? { url: url.replace(/\/$/, ''), anonKey }
    : null;
}

function bearerToken(request) {
  const value = request.headers.get('authorization') || '';
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || '';
}

async function supabaseRequest(env, path, options = {}, token = '') {
  const config = supabaseConfig(env);
  if (!config) return null;
  const headers = new Headers(options.headers || {});
  headers.set('apikey', config.anonKey);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(`${config.url}${path}`, { ...options, headers });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  return { response, payload };
}

async function supabaseUserFrom(request, env) {
  const token = bearerToken(request);
  if (!token) return null;
  try {
    const result = await supabaseRequest(env, '/auth/v1/user', { method: 'GET' }, token);
    if (!result?.response.ok || !result.payload?.id) return null;
    return { userId: result.payload.id, email: result.payload.email || '', accessToken: token, source: 'supabase' };
  } catch { return null; }
}

async function authenticatedUser(request, env) {
  const platformUser = userFrom(request);
  if (platformUser) return { ...platformUser, source: 'platform' };
  return supabaseUserFrom(request, env);
}

async function supabaseGameId(env, token = '') {
  const result = await supabaseRequest(env, '/rest/v1/games?slug=eq.juno&is_published=eq.true&select=id&limit=1', { method: 'GET' }, token);
  return result?.response.ok && Array.isArray(result.payload) ? result.payload[0]?.id || '' : '';
}

function supabaseEntryFromPage(row) {
  const content = row && row.content && typeof row.content === 'object' ? row.content : {};
  const stored = content.entry && typeof content.entry === 'object' ? content.entry : {};
  const id = typeof content.entry_id === 'string' ? content.entry_id : stored.id;
  if (!id) return null;
  return normalizeWeaponEntry(normalizeEnemyEntry({
    ...stored,
    id,
    game: 'ten-saviors',
    title: row.title || stored.title || id,
    summary: row.summary ?? stored.summary ?? '',
    revision: Math.max(0, Number(row.version || 1) - 1),
    updatedAt: row.updated_at,
    source: 'クラウド編集',
  }));
}

async function listSupabaseEntries(env) {
  const gameId = await supabaseGameId(env);
  if (!gameId) return [];
  const result = await supabaseRequest(env, `/rest/v1/wiki_pages?game_id=eq.${encodeURIComponent(gameId)}&status=eq.published&deleted_at=is.null&select=id,title,summary,content,version,updated_at&limit=1000`, { method: 'GET' });
  if (!result?.response.ok || !Array.isArray(result.payload)) return [];
  return result.payload.map(supabaseEntryFromPage).filter(Boolean);
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
  if (!env.DB) {
    try {
      const overrides = await listSupabaseEntries(env);
      if (!overrides.length) return defaultEntries;
      const stored = new Map(overrides.map(entry => [entry.id, entry]));
      for (const entry of defaultEntries) if (!stored.has(entry.id)) stored.set(entry.id, entry);
      return [...stored.values()];
    } catch { return defaultEntries; }
  }
  const result = await env.DB.prepare('SELECT * FROM entries WHERE is_deleted = 0 ORDER BY sort_order, title').all();
  const stored = new Map((result.results || []).map(row => {
    const entry = normalizeWeaponEntry(normalizeEnemyEntry(toEntry(row)));
    return [row.id, entry];
  }));
  for (const entry of defaultEntries) if (!stored.has(entry.id)) stored.set(entry.id, entry);
  return [...stored.values()];
}

function parseEntryInput(input) {
  const title = cleanText(input.title, 80);
  const category = CATEGORY_SET.has(input.category) ? input.category : '';
  if (!title || !category) return { error: '名前とカテゴリーは必須です。' };
  const accent = ACCENT_SET.has(input.accent) ? input.accent : 'lime';
  const id = cleanText(input.id, 100) || `${category}-${crypto.randomUUID()}`;
  const revision = Number.isInteger(input.revision) && input.revision >= 0 ? input.revision : 0;
  const entry = {
    id, game: 'ten-saviors', category, title,
    subtitle: cleanText(input.subtitle, 120), summary: cleanText(input.summary, 240),
    body: cleanText(input.body, 6000), tags: Array.isArray(input.tags) ? input.tags.map(x => cleanText(x, 40)).filter(Boolean).slice(0, 12) : [],
    accent, sortOrder: 0, revision: revision + 1, updatedAt: Date.now(), source: 'クラウド編集'
  };
  if (category === 'enemies' && input.enemyClass !== undefined) {
    entry.body = updateEnemyBody(entry.body, {
      classification: cleanText(input.enemyClass, 40),
      chapter: cleanText(input.enemyChapter, 100),
      location: cleanText(input.enemyLocation, 120),
    });
  }
  return { id, revision, entry: normalizeWeaponEntry(normalizeEnemyEntry(entry)) };
}

async function saveSupabaseEntry(request, env, user, input) {
  const parsed = parseEntryInput(input);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const { id, revision, entry } = parsed;
  const gameId = await supabaseGameId(env, user.accessToken);
  if (!gameId) return json({ error: 'Supabase側のゲーム設定を確認できません。' }, 503);
  const pages = await supabaseRequest(env, `/rest/v1/wiki_pages?game_id=eq.${encodeURIComponent(gameId)}&status=eq.published&deleted_at=is.null&select=id,title,summary,content,version,updated_at&limit=1000`, { method: 'GET' }, user.accessToken);
  if (!pages?.response.ok || !Array.isArray(pages.payload)) return json({ error: 'Wikiデータを確認できません。' }, 503);
  const existing = pages.payload.find(row => {
    const content = row.content && typeof row.content === 'object' ? row.content : {};
    return content.entry_id === id || content.entry?.id === id;
  });
  const content = { entry_id: id, entry };
  if (!existing) {
    if (revision !== 0) return json({ conflict: true, currentRevision: 0 }, 409);
    const slug = `worker-${id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 180) || crypto.randomUUID()}`;
    const created = await supabaseRequest(env, '/rest/v1/rpc/create_wiki_page', {
      method: 'POST', headers: { prefer: 'return=representation' },
      body: JSON.stringify({ p_game_id: gameId, p_slug: slug, p_title: entry.title, p_summary: entry.summary, p_content: content, p_status: 'published' }),
    }, user.accessToken);
    if (!created?.response.ok) return json({ error: 'Wiki保存に失敗しました。' }, created?.response.status === 403 ? 403 : 400);
    const page = Array.isArray(created.payload) ? created.payload[0] : created.payload;
    return json({ saved: true, entry: { ...entry, revision: Math.max(0, Number(page?.version || 1) - 1), updatedAt: page?.updated_at || entry.updatedAt } });
  }
  const currentRevision = Math.max(0, Number(existing.version || 1) - 1);
  if (currentRevision !== revision) return json({ conflict: true, currentRevision }, 409);
  const updated = await supabaseRequest(env, '/rest/v1/rpc/update_wiki_page', {
    method: 'POST', headers: { prefer: 'return=representation' },
    body: JSON.stringify({
      p_page_id: existing.id, p_expected_version: Number(existing.version || 1), p_title: entry.title,
      p_summary: entry.summary, p_content: content, p_status: 'published', p_change_note: 'Pages editor update',
    }),
  }, user.accessToken);
  if (!updated?.response.ok) {
    const message = JSON.stringify(updated?.payload || '');
    if (updated?.response.status === 409 || message.includes('WIKI_VERSION_CONFLICT')) return json({ conflict: true, currentRevision }, 409);
    if (updated?.response.status === 403 || message.includes('EDITOR_ROLE_REQUIRED')) return json({ error: 'Editor以上のRoleが必要です。' }, 403);
    return json({ error: 'Wiki保存に失敗しました。' }, 400);
  }
  const page = Array.isArray(updated.payload) ? updated.payload[0] : updated.payload;
  return json({ saved: true, entry: { ...entry, revision: Math.max(0, Number(page?.version || existing.version + 1) - 1), updatedAt: page?.updated_at || entry.updatedAt } });
}

async function saveEntry(request, env) {
  const user = await authenticatedUser(request, env);
  if (!user) return json({ error: '編集にはログインが必要です。' }, 401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: '送信元を確認できません。' }, 403);
  let input;
  try { input = await request.json(); } catch { return json({ error: '入力内容を読み取れません。' }, 400); }
  if (user.source === 'supabase') {
    const role = await supabaseRequest(env, '/rest/v1/rpc/current_role', { method: 'POST', body: '{}' }, user.accessToken);
    if (!role?.response.ok || !['editor', 'admin'].includes(role.payload)) return json({ error: 'Editor以上のRoleが必要です。' }, 403);
    return saveSupabaseEntry(request, env, user, input);
  }
  if (!env.DB) return json({ error: 'クラウドデータベースを利用できません。' }, 503);
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
  const normalizedEntry = normalizeWeaponEntry(normalizeEnemyEntry(entry));
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
    const cacheControl = asset.type.startsWith('text/javascript') ? 'no-cache' : 'public, max-age=3600';
    return new Response(bytes, { headers: { 'content-type': asset.type, 'cache-control': cacheControl, 'x-content-type-options': 'nosniff' } });
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
  return new Response(request.method === 'HEAD' ? null : renderPage({
    supabaseUrl: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' } });
}

export default { fetch: handle };
