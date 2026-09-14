const config = window.__SUPABASE_CONFIG__ || {};
const sessionKey = 'ttowelve.supabase.session';
let session = readSession();

function readSession() {
  try {
    const value = JSON.parse(localStorage.getItem(sessionKey) || 'null');
    return value && typeof value.access_token === 'string' ? value : null;
  } catch { return null; }
}

function saveSession(value) {
  session = value || null;
  try {
    if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
    else localStorage.removeItem(sessionKey);
  } catch {}
}

function configured() {
  return typeof config.url === 'string' && config.url.startsWith('https://') && typeof config.anonKey === 'string' && config.anonKey.length > 20;
}

function apiError(payload, fallback = 'Supabaseとの通信に失敗しました。') {
  const message = payload?.msg || payload?.message || payload?.error_description || payload?.error;
  return new Error(typeof message === 'string' ? message : fallback);
}

function userFromToken(token) {
  try {
    const part = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const payload = JSON.parse(decodeURIComponent(escape(atob(part))));
    return payload.sub ? { id: payload.sub, email: payload.email || '' } : null;
  } catch { return null; }
}

async function request(path, options = {}) {
  if (!configured()) throw new Error('Supabase連携はまだ設定されていません。');
  const headers = new Headers(options.headers || {});
  headers.set('apikey', config.anonKey);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const response = await fetch(`${config.url}${path}`, { ...options, headers });
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) throw apiError(payload, `Supabaseでエラーが発生しました（${response.status}）。`);
  return payload;
}

async function refreshIfNeeded() {
  if (!session?.refresh_token || !session.expires_at || session.expires_at * 1000 > Date.now() + 30000) return session;
  const body = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session.refresh_token }) });
  saveSession(body?.access_token ? { ...body, user: body.user || session.user || userFromToken(body.access_token) } : null);
  return session;
}

export function isSupabaseConfigured() { return configured(); }
export function currentSession() { return session; }
export function currentUser() { return session?.user || (session?.access_token ? userFromToken(session.access_token) : null); }

export async function signIn(email, password) {
  const body = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  if (!body?.access_token) throw new Error('ログイン情報を確認できませんでした。');
  saveSession({ ...body, user: body.user || userFromToken(body.access_token) });
  return session;
}

export async function signUp(email, password, displayName) {
  const body = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ email: email.trim(), password, data: { display_name: displayName.trim() || 'Player' } }) });
  if (body?.access_token) saveSession({ ...body, user: body.user || userFromToken(body.access_token) });
  return body;
}

export async function signOut() {
  try { if (session?.access_token) await request('/auth/v1/logout', { method: 'POST' }); }
  finally { saveSession(null); }
}

export async function getSession() {
  await refreshIfNeeded();
  return session;
}

async function currentRole() {
  const role = await request('/rest/v1/rpc/current_role', { method: 'POST', body: '{}' });
  return typeof role === 'string' ? role : 'user';
}

export async function submitWikiProposal({ entry, title, summary, content }) {
  const active = await getSession();
  const user = active?.user || (active?.access_token ? userFromToken(active.access_token) : null);
  if (!active?.access_token || !user?.id) throw new Error('提案を送るにはログインが必要です。');
  const role = await currentRole();
  if (!['contributor', 'editor', 'admin'].includes(role)) throw new Error('提案送信にはContributor以上のRoleが必要です。');
  const games = await request('/rest/v1/games?slug=eq.juno&is_published=eq.true&select=id&limit=1', { method: 'GET' });
  const gameId = Array.isArray(games) ? games[0]?.id : null;
  if (!gameId) throw new Error('Supabase側の「十の救現主」ゲーム設定を確認できません。DB内容は変更していません。');
  const rows = await request('/rest/v1/wiki_edit_proposals', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      page_id: null,
      game_id: gameId,
      proposer_user_id: user.id,
      title: title.trim(),
      summary: summary.trim(),
      content: { source: 'TTowelve Archive', entry_id: entry.id, entry_title: entry.title, proposed_text: content },
      status: 'open',
    }),
  });
  return Array.isArray(rows) ? rows[0] : rows;
}
